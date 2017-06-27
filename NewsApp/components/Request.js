export const Post = function (url, body) {
	var formBody = [];
    for (var property in body) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    var head = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
    formBody = formBody.join("&");
    return fetch(url, {
        method: 'POST',
        headers: head,
        body: formBody
    })
    .then((response) => response.json())
}

export const Delete = function (url, body) {
    var formBody = [];
    for (var property in body) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    var head = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
    formBody = formBody.join("&");
    return fetch(url, {
        method: 'DELETE',
        headers: head,
        body: formBody
    })
    .then((response) => response.json())
}

export const Get = function (url) {
    return fetch(url)
    .then((response) => response.json())
}

export const Guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

export const GetQueryStringMap = function (url) {
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