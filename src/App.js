import React from "react";
import { Page, Tabbar, Tab, Navigator, Dialog } from "react-onsenui";
import Home from "./Home";
import AddTorrents from "./AddTorrents";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import ons from 'onsenui'
import io from "socket.io-client";
const AppContext = React.createContext();
class Tabs extends React.Component {
  state = {
    index: 0
  }

  setIndex = index => this.setState({index})

  renderTabs = (active, tabbar) => {
    return [
      {
        content: <Home key="home" navigator={this.props.navigator} socket={this.props.socket} active={active === 0} tabbar={tabbar}/>,
        tab: <Tab key="home" label="Home" icon="ion-ios-home" />
      },
      {
        content: <AddTorrents key="torrents" setTab={this.setIndex} showError={this.props.showError} navigator={this.props.navigator} socket={this.props.socket} active={active === 0} tabbar={tabbar} />,
        tab: <Tab key="plants" label="Add Torrents" icon="ion-ios-magnet" />
      }
    ];
  };

  render() {
    return (
      <Page>
        <Tabbar onPreChange={({index}) => this.setState({index})} index={this.state.index} swipeable renderTabs={this.renderTabs} />
      </Page>
    );
  }
}

let server = "http://evenburgers.com/";

class App extends React.Component {
  state = {
    torrents: [],
    socket: io(server),
    showError: false,
  };

  getData = async torrents => {
    this.setState({
      torrents
    });
  };

  addTorrent = async magnet => {
    this.state.socket.emit("addTorrent", magnet);
  };

  downloadTorrent = hash => {
    this.state.socket.emit("download", hash);
  };

  getFile = (hash, name) => {
    this.state.socket.emit("downloadFile", hash, name);
  };

  downloadFiles = (torrent, files) => {
    let zip = new JSZip();
    files.forEach(file => {
      zip.file(file.name, file.buffer);
    });
    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, encodeURI(torrent.name) + ".zip");
    });
  };

  downloadFile = file => {
    console.log(file);
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(
        new File([file.buffer], file.name),
        file.name
      );
    } else {
      let newFile = new File([file.buffer], file.name);
      let link = window.document.createElement("a");
      link.href = window.URL.createObjectURL(newFile);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(newFile);
    }
  };

  componentDidMount() {
    setInterval(() => this.state.socket.emit("torrents"), 500);
    this.state.socket.on("torrents", torrents => this.getData(torrents));
    this.state.socket.on("files", this.downloadFiles);
    this.state.socket.on("file", this.downloadFile);
    this.state.socket.on("fail", () => ons.notification.alert('Sorry! The torrent you tried to add was invalid.'));
  }

  componentDidCatch(error, info) {
    this.setState({
      showError: true,
      error: { error, info }
    });
  }

  renderPage = (route, navigator) => {
    route.props = route.props || {};
    route.props.navigator = navigator;
    route.props.socket = this.state.socket;
    route.props.showError = () => this.setState({showError: true})

    return React.createElement(route.comp, route.props);
  };

  onCancel = () => this.setState({showError: false})

  render() {
    let { torrents } = this.state;

    return (
      <AppContext.Provider
        value={{
          torrents,
          socket: this.state.socket,
          addTorrent: this.addTorrent,
          downloadTorrent: this.downloadTorrent,
          downloadFile: this.getFile
        }}
      >
        <Dialog onCancel={this.onCancel}
          isOpen={this.state.showError}
          style={{height: 250}}  cancelable>
          <Page>
            Sorry! The torrent you tried to add was invalid.
          </Page>
          </Dialog>
        <Navigator
          initialRoute={{ comp: Tabs, props: { key: "tabs" } }}
          renderPage={this.renderPage}
        />
      </AppContext.Provider>
    );
  }
}

export const Context = AppContext;
export default App;
