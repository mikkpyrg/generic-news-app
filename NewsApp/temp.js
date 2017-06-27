
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Linking,
  Button,
  AsyncStorage
} from 'react-native';

export default class NewsApp extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        var s = this.state;
        s.fromUtl = false;
        s._clientId = "demo_client_application";
        s._clientSecret = "password12345";
        s._tokenEndpoint = "https://ssotestlogin.aripaev.ee/OAuth/Token";
        s._authorizeEndpoint = "https://ssotestlogin.aripaev.ee/OAuth/Authorize";
        s._logoutEndpoint = "https://ssotestlogin.aripaev.ee/logi-valja";
        s._resourceEndpoint = "https://ssotestapi.aripaev.ee";
        s._loginCallbackUrl = "newsapp://login";
        s._scope = "/UserDataService/json/Profile /UserDataService/json/Permissions /UserDataService/json/Orders";
        var stateCode = Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1);
        this.state.requestCodeUrl = s._authorizeEndpoint
            + "?client_id=" + encodeURIComponent(s._clientId)
            + "&response_type=code"
            + "&redirect_uri=" + encodeURIComponent(s._loginCallbackUrl)
            + "&scope=" + encodeURIComponent(s._scope)
            + "&state=" + stateCode;
    }
    componentDidMount() {
        // Handling Deep Linking
        const deepLinkUrl = Linking.getInitialURL().then((url) => {
            if (url) {
                var s = this.state;x
                var params = getQueryStringMap(url);
                s.code = params.code;
                this.forceUpdate();
            }
        }).catch(err => console.error('An error occurred', err));
    }
    doLoginQuery() {
        var s = this.state;
        if(s.code) {
            var data = {
                code: s.code,
                redirect_uri: encodeURIComponent(s._loginCallbackUrl),
                grant_type: "authorization_code"/*,
                client_id: s._clientId,
                client_secret: s._clientSecret*/
            };
            var head = {
                Authorization: "Basic " + Base64.encode(s._clientId + ":" + s._clientSecret),
                "Content-Type": "application/x-www-form-urlencoded"
            }
            fetch(s._tokenEndpoint, {
                method: "POST",
                cache: 'default',
                head: JSON.stringify(head),
                body: JSON.stringify(data)
            })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson);
                this.setState({
                    "_accessToken": responseJson.access_token,
                    "_refreshToken": responseJson.refresh_token,
                    "error": ""
                });
            })
            .catch((error) => {
                this.setState({"error": "Fetch Failed"});
            })
        } else {
            this.setState({"error": "no Code"});
        }

    }
    getPuppies() {
        fetch("http://192.168.1.185:3000/api/puppies", {
            method: "get"
        }).then((response) => response.json())
        .then((responseJson) => {
            console.log(responseJson);
            var puppers = responseJson.data.map((pupper) => pupper.name + " ");
            puppers += "are my motherfucking puppers."
            this.setState({
                "code": puppers,
                "error": ""
            });
        })
        .catch((error) => {
            console.log(error);
            this.setState({"error": "no puppies"});
        })
    }
    render() {
        var s = this.state;
        return (
            <View style={styles.container}>
                <Text style={{color: 'blue'}}
                  onPress={() => Linking.openURL(s.requestCodeUrl)}>
                  link to app
                </Text>
                <Text>
                  Code:
                  {s.code}
                </Text>
                <Text>
                  RefreshToken:
                  {s._refreshToken}
                </Text>
                <Text>
                  AccessToken:
                  {s._accessToken}
                </Text>
                <Text>
                  Error:
                  {s.error}
                </Text>
                <Button onPress={this.doLoginQuery.bind(this)} 
                    title="Learn More" 
                    color="#841584" 
                    accessibilityLabel="Learn more about this purple button"/>
                <Button onPress={this.getPuppies.bind(this)} 
                    title="Give puppies" 
                    color="#841584" 
                    accessibilityLabel="Learn more about this purple button"/>
            </View>
        );
    }
}
function getQueryStringMap(url) {
    var map = {};

    var query = url.split("?")[1];
    var queryParameters = query.split("&");
    for (var i = 0; i < queryParameters.length; i++) {
        var queryParameter = queryParameters[i];

        var pair = queryParameter.split("=");
        var name = pair[0];
        var value = decodeURIComponent(pair[1]);

        map[name] = value;
    }

    return map;
}

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
var Base64 = {

    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('NewsApp', () => NewsApp);
