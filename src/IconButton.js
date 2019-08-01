import React, { Component } from "react";
import {
    Icon,
    Ripple
  } from "react-onsenui";

class IconButton extends Component {
  render() {
    return (
      <React.Fragment>
        <Icon icon={{ default: this.props.icon }} size={{ default: this.props.iconSize || 40 }} style={{color: this.props.color}} />
        <p>{this.props.text}</p>
        <Ripple onClick={this.props.onClick} color={this.props.rippleColor} background={this.props.background} style={{borderRadius: 10}} />
      </React.Fragment>
    );
  }
}

export default IconButton;