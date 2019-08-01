import React, { Component } from "react";
import {
  Page,
  List,
  BackButton,
  Toolbar,
  ListItem,
  Button,
  ListHeader,
  ProgressCircular
} from "react-onsenui";
import ons from "onsenui";
import JSZip from "jszip";
import { Context } from "./App";
import {saveAs} from 'file-saver';
import { Progress } from "react-sweet-progress";

class ViewFilesPage extends Component {
  state = {
    files: [],
    downloadingFiles: [],
    allProgress: -1
  };

  componentDidMount = () => {
    this.props.socket.on("fileList", list => {
      console.log(list);
      this.setState({ files: list });
    });

    this.props.socket.emit("getFileList", this.props.torrent.infoHash);
  };

  saveFile = (blob, name) => {
    console.log({ blob, name });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, name);
    } else {
      let link = window.document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blob);
    }
  };

  downloadFile = async (hash, name) => {
    this.setState({
      downloadingFiles: [...this.state.downloadingFiles, name],
    });

    let res = await fetch(
      `http://evenburgers.com/kevtorrent/download?infoHash=${encodeURIComponent(
        hash
      )}&fileName=${encodeURIComponent(name)}`
    );
    if (res.ok) {
      let blob = await res.blob();
      ons.notification.toast("Downloading " + name + "...", { timeout: 1000 });
      this.saveFile(blob, name);
      this.setState({
        downloadingFiles: this.state.downloadingFiles.filter(
          file => file !== name
        )
      });
    } else {
      ons.notification.toast("There was an error downloading: " + name + "", {
        timeout: 1000
      });
      this.setState({
        downloadingFiles: this.state.downloadingFiles.filter(
          file => file !== name
        )
      });
    }
  };

allProgress = (proms) => {
    let d = 0;
    this.setState({allProgress: 0})
    for (const p of proms) {
      p.then(()=> {    
        d ++;
        this.setState( {allProgress: d / proms.length} );
      });
    }
    return Promise.all(proms);
  }

  downloadAll = async () => {

    this.setState({
        downloadingFiles: this.state.files.map(file => file.name)
    })
    let reactThis = this;
    this.allProgress(
      this.state.files.map(file =>
        fetch(
          `http://evenburgers.com/kevtorrent/download?infoHash=${encodeURIComponent(
            this.props.torrent.infoHash
          )}&fileName=${encodeURIComponent(file.name)}`
        )
      )
    )
    .then(responses => Promise.all(responses.map(resp => resp.blob())))
    .then(files => {
      let zip = new JSZip();
      files.forEach((file, index) => {
        zip.file(this.state.files[index].name, file);
      });
      let torrentName = this.props.torrent.name
      zip.generateAsync({ type: "blob" }).then(function(content) {
        saveAs(content, encodeURI(torrentName) + ".zip");
        reactThis.setState({
            downloadingFiles: [],
            allProgress: -1
        })
      });
    });
  };

  renderToolbar = title => {
    return (
      <Toolbar>
        <div className="left">
          <BackButton>Back</BackButton>
        </div>
        <div className="center">{title}</div>
      </Toolbar>
    );
  };

  render() {
    return (
      <Context.Consumer>
        {context => (
          <Page
            renderToolbar={() => this.renderToolbar(this.props.torrent.name)}
          >
            <Button disabled={this.state.downloadingFiles.length > 0} style={{width: '100%'}} onClick={this.downloadAll}>Download All</Button>
            {this.state.allProgress !== -1 && <Progress percent={Math.ceil(this.state.allProgress * 100)} />}
            <List
              renderHeader={() => <ListHeader>Files</ListHeader>}
              dataSource={this.state.files}
              renderRow={(file, idx) => {
                return (
                  <ListItem
                    key={file.name}
                    modifier={
                      idx === context.torrents.length - 1 ? "longdivider" : null
                    }
                  >
                    <div class="left">{file.name}</div>
                    <div class="right">
                      {this.state.downloadingFiles.includes(file.name) ? (
                        <ProgressCircular indeterminate />
                      ) : (
                        <Button
                          onClick={() =>
                            this.downloadFile(
                              this.props.torrent.infoHash,
                              file.name
                            )
                          }
                        >
                          Download
                        </Button>
                      )}
                    </div>
                  </ListItem>
                );
              }}
            />
          </Page>
        )}
      </Context.Consumer>
    );
  }
}

export default ViewFilesPage;
