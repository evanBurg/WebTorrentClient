const fs = require("fs");
const express = require("express");
const { exec } = require('child_process');
const bodyParser = require("body-parser");
const RutrackerAPI = new (require("rutracker-api-2"))();
const parseTorrent = require("parse-torrent");
const path = require("path");
const https = require("https");
const http = require("http");
const app = express();
var cors = require("cors");
const WebTorrent = require("webtorrent-hybrid");
var stringify = require("json-stringify-safe");
app.use(cors());
const serverRoot = "/kevtorrent";

const username = "Burgy";
const password = "eb042698";

const options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./chain.pem")
};
let client = new WebTorrent();
let previousTorrents = [];

validTorrent = torrentIdentifier => {
  let invalid = true;
  try {
    let testClient = new WebTorrent();
    testClient.on('error', () => {
      invalid =  false;
    })
    testClient.add(torrentIdentifier)
    
    setTimeout(() => {if(invalid !== false) invalid = true; testClient.destroy();}, 2000);
  } catch (e) {
    invalid = false
  } finally {
    return invalid;
  }
  return invalid;
};

app.use(serverRoot, express.static(path.join(__dirname, "build")));

app.get(serverRoot, function(req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

search = (req, res) => {
  RutrackerAPI.login(username, password)
    .then(() => RutrackerAPI.search(req.query.query, "seeds", false))
    .then(results => {
      res.send(results);
    })
    .catch(err => {
      RutrackerAPI.getCaptcha().then(captcha => {
        res.send(captcha);
      });
    });
};

app.get(serverRoot + "/search", search);

app.get(serverRoot + "/addTorrent", (req, res) => {
  RutrackerAPI.login(username, password)
    .then(cookie => RutrackerAPI.download(req.query.id))
    .then(file => {
      const ws = fs.createWriteStream("./sample.torrent");
      file.pipe(ws);
      file.on("end", () => {
        if (validTorrent(path.join("./sample.torrent"))) {
          client.add(path.join("./sample.torrent"));
          //fs.unlink(path.join("./sample.torrent"));
          res.send("success");
        } else {
          res.status(400).send("fail");
        }
      });
    });
});

app.get(serverRoot + "/download", (req, res) => {
  let torrent = client.torrents.find(
    torrent => torrent.infoHash === req.query.infoHash
  );
  let file = torrent.files.find(file => file.name === req.query.fileName);

  file.createReadStream().pipe(res);
});

let server2 = http.createServer(app).listen(8072);
var io2 = require("socket.io")(server2);

torrentData = torrent => {
  return {
    name: torrent.name,
    magnetURI: torrent.magnetURI,
    progress: torrent.progress,
    infoHash: torrent.infoHash,
    timeRemaining: torrent.timeRemaining,
    received: torrent.received,
    downloaded: torrent.downloaded,
    uploaded: torrent.uploaded,
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed
  };
};

fileData = file => {
  return {
    name: file.name,
    path: file.path,
    length: file.length,
    downloaded: file.downloaded,
    progress: file.progress
  };
};

io2.on("connection", function(socket) {
  socket.on("addTorrent", magnet => {
    try {
      if (validTorrent(magnet)) {
        client.add(magnet);
        socket.emit("torrents", client.torrents.map(torrentData));
      } else {
        socket.emit("fail");
      }
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("torrents", () =>
    socket.emit("torrents", client.torrents.map(torrentData))
  );

  socket.on("download", infoHash => {
    let torrent = client.torrents.find(
      torrent => torrent.infoHash === infoHash
    );
    let returnBlob = [];
    torrent.files.forEach((file, index) => {
      file.getBuffer(function(err, buffer) {
        if (err) throw err;
        returnBlob.push({
          name: file.name,
          buffer: buffer
        });

        if (returnBlob.length === torrent.files.length)
          socket.emit("files", torrentData(torrent), returnBlob);
      });
    });
  });
  socket.on("getFileList", (infoHash, fileName) => {
    let torrent = client.torrents.find(
      torrent => torrent.infoHash === infoHash
    );

    socket.emit("fileList", torrent.files.map(fileData));
  });
  socket.on("downloadFile", (infoHash, fileName) => {
    let torrent = client.torrents.find(
      torrent => torrent.infoHash === infoHash
    );
    let file = torrent.files.find(file => file.name === fileName);

    file.getBuffer(function(err, buffer) {
      if (err) throw err;
      socket.emit("file", { name: file.name, buffer });
    });
  });
  socket.on("restart", () => {
    exec("pm2 restart kevtorrent")
  })
  socket.on("removeAll", () => {
    this.client.torrents.forEach(torrent => {
      torrent.destroy();
    });
  });
});

function saveTorrents() {
  if (client && client.torrents.length > 0) {
    let magnets = client.torrents.map(torrent => torrent.magnetURI);
    fs.writeFileSync("./torrents.json",JSON.stringify(magnets, null, 2), 'utf8');
  }
};

loadTorrents = () => {
  try {
    let magnets = JSON.parse(fs.readFileSync("./torrents.json"));
    magnets.forEach(torrent => {
      if (validTorrent(torrent)) client.add(torrent);
    });
  } catch (e) {
    console.log(e);
  }
};

client.on("error", () => {
  loadTorrents();
});
loadTorrents();
setInterval(saveTorrents, 1000);
