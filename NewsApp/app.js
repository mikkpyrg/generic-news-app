import React, { Component } from 'react';
import Tabs from './router';
import EventEmitter from "EventEmitter";

class App extends Component {

	componentWillMount() {
	    this.eventEmitter = new EventEmitter();
	}

	render() {
		return <Tabs screenProps={{events: this.eventEmitter}}/>;
	}
}

export default App;
