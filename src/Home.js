import { Progress } from "react-sweet-progress";
import "react-sweet-progress/lib/style.css";
import React from "react";
import {
  Page,
  Toolbar,
  List,
  ListHeader,
  Fab,
  Ripple,
  Icon,
  PullHook,
  ListItem,
  Button,
  Row,
  Col
} from "react-onsenui";
import ons from "onsenui";
import IconButton from "./IconButton";
import { Context } from "./App";
import ViewFilesPage from "./ViewFilesPage";

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  addTorrent = context => {
    ons.notification.prompt({
      message: "Paste the magnet URI here:",
      callback: magnet => {
        context.addTorrent(magnet);
      }
    });
  };

  renderToolbar = title => {
    return (
      <Toolbar>
        <div className="center">{title}</div>
      </Toolbar>
    );
  };

  renderFab = () => {
    return (
      <Context.Consumer>
        {context => (
          <Fab position="bottom right" onClick={() => this.addTorrent(context)}>
            <Icon
              icon="fa-plus"
              size={26}
              style={{ verticalAlign: "middle" }}
            />
          </Fab>
        )}
      </Context.Consumer>
    );
  };

  timeConversion = millisec => {
    var seconds = (millisec / 1000).toFixed(1);

    var minutes = (millisec / (1000 * 60)).toFixed(1);

    var hours = (millisec / (1000 * 60 * 60)).toFixed(1);

    var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

    if (seconds < 60) {
      return seconds + " Sec";
    } else if (minutes < 60) {
      return minutes + " Min";
    } else if (hours < 24) {
      return hours + " Hrs";
    } else {
      return days + " Days";
    }
  };

  render() {
    return (
      <Page renderToolbar={() => this.renderToolbar("Home")}>
        <List>
          <h1 style={{ textAlign: "center" }}>Kev Torrent Client</h1>
          <Context.Consumer>
            {context => (
              <Row
                verticalAlign="center"
                style={{
                  justifyContent: "space-evenly",
                  alignItems: "center"
                }}
              >
                <Col
                  onClick={() => this.addTorrent(context)}
                  style={{
                    justifyContent: "space-evenly",
                    alignItems: "center",
                    textAlign: "center"
                  }}
                >
                  <IconButton
                    icon="md-plus-circle"
                    text="Add Torrent"
                    color="#4CAF50"
                  />
                </Col>
                <Col
                  onClick={() => context.socket.emit("restart")}
                  style={{
                    justifyContent: "space-evenly",
                    alignItems: "center",
                    textAlign: "center"
                  }}
                >
                  <IconButton
                    icon="md-refresh"
                    text="Restart Server"
                    color="#F44336"
                  />
                </Col>
              </Row>
            )}
          </Context.Consumer>
        </List>
        <Context.Consumer>
          {context => (
            <List
              renderHeader={() => <ListHeader>Torrents</ListHeader>}
              style={{ maxHeight: "-webkit-fill-available", overflowY: "auto" }}
              dataSource={context.torrents}
              renderRow={(torrent, idx) => {
                return (
                  <ListItem
                    key={torrent.infoHash}
                    modifier={
                      idx === context.torrents.length - 1 ? "longdivider" : null
                    }
                  >
                    <div
                      class="left"
                      style={{ display: "flex", flexDirection: "column" }}
                    >
                      <Row>
                        <Col>{torrent.name}</Col>
                      </Row>
                      <Row style={{ marginTop: 10 }}>
                        <Col>
                          <Progress
                            percent={Math.ceil(torrent.progress * 100)}
                          />
                        </Col>
                      </Row>
                    </div>
                    <div
                      class="right"
                      style={{ display: "flex", flexDirection: "column" }}
                    >
                      {torrent.progress !== 1 ? (
                        <React.Fragment>
                          <Row>
                            <Col>
                              <Button
                                disabled={torrent.progress !== 1}
                                onClick={() =>
                                  this.props.navigator.pushPage({
                                    comp: ViewFilesPage,
                                    props: {
                                      key: torrent.infoHash,
                                      torrent: torrent,
                                      socket: this.props.socket
                                    }
                                  })
                                }
                              >
                                Files
                              </Button>
                            </Col>
                          </Row>
                          <Row style={{ marginTop: 10 }}>
                            <Col>
                              {this.timeConversion(torrent.timeRemaining)}
                            </Col>
                          </Row>
                        </React.Fragment>
                      ) : (
                        <Button
                          disabled={torrent.progress !== 1}
                          onClick={() =>
                            this.props.navigator.pushPage({
                              comp: ViewFilesPage,
                              props: {
                                key: torrent.infoHash,
                                torrent: torrent,
                                socket: this.props.socket
                              }
                            })
                          }
                        >
                          Files
                        </Button>
                      )}
                    </div>
                  </ListItem>
                );
              }}
            />
          )}
        </Context.Consumer>
      </Page>
    );
  }
}

export default Home;
