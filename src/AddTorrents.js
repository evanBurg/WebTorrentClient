import React, { Component } from "react";
import {
  Page,
  Toolbar,
  List,
  ListItem,
  ListHeader,
  SearchInput,
  Button,
  ProgressBar
} from "react-onsenui";

import ons from 'onsenui'

class AddTorrents extends Component {
  constructor(props) {
    super(props);

    this.state = {
      results: [],
      query: "",
      loading: false,
      itemsToShow: 30,
      page: 0
    };
  }

  search = async () => {
    let { query } = this.state;

    this.setState({ loading: true, page: 0 });
    if (query) {
      let res = await fetch(
        `http://evenburgers.com/kevtorrent/search?query=${query}`
      );
      if (res.ok) {
        this.setState({
          results: await res.json(),
          loading: false
        });
      } else {
        this.setState({
          loading: false
        });
      }
    }
  };

  addTorrent = async id => {
    this.setState({ loading: true });

    let res = await fetch(`http://evenburgers.com/kevtorrent/addTorrent?id=${id}`);

    if(!res.ok){
        ons.notification.alert('Sorry! The torrent you tried to add was invalid.');
    }

    this.props.setTab(0);

    this.setState({ loading: false });
  };

  changeQuery = async e => {
    this.setState({ query: e.target.value });
  };

  renderToolbar = title => {
    return (
      <Toolbar>
        <div className="center">{title}</div>
      </Toolbar>
    );
  };

  nextPage = () => {
    let { results, itemsToShow, page } = this.state;
    results = results.filter(
      (result, index) =>
        index >= page+1 * itemsToShow && index <= itemsToShow * (page + 2)
    );

    if (results.length > 0) {
      this.setState({
        page: page + 1
      });
    }
  };

  render() {
    let { results, itemsToShow, page } = this.state;
    results = results.filter(
      (result, index) =>
        index >= page * itemsToShow && index <= itemsToShow * (page + 1)
    );
    return (
      <Page renderToolbar={() => this.renderToolbar("Search")}>
        {this.state.loading && <ProgressBar indeterminate />}
        <List>
          <ListItem>
            <div className="left">
              <SearchInput
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    this.search();
                  }
                }}
                value={this.state.query}
                onChange={this.changeQuery}
              />
            </div>
            <div className="right">
              <Button onClick={this.search}>Search</Button>
            </div>
          </ListItem>
        </List>
        <List
          onScroll={this.handleScroll}
          style={{ maxHeight: "-webkit-fill-available", overflowY: "auto" }}
          renderHeader={() => <ListHeader>Results</ListHeader>}
          dataSource={results}
          renderRow={result => {
            return (
              <ListItem key={result.id}>
                <div
                  class="left"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <span class="list-item__title">{result.title}</span>
                  <span class="list-item__subtitle">{`${
                    result.downloads
                  } Downloads | Seads ${result.seeds} | Leachs ${
                    result.leechs
                  }`}</span>
                </div>
                <div class="right">
                  <Button onClick={() => this.addTorrent(result.id)}>
                    Add Torrent
                  </Button>
                </div>
              </ListItem>
            );
          }}
        />
        <Button
          onClick={this.nextPage}
          disabled={results.length < 1}
          style={{ width: "100%" }}
        >
          Next Page
        </Button>
      </Page>
    );
  }
}

export default AddTorrents;
