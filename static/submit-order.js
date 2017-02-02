var request = new XMLHttpRequest();
request.open('POST', 'https://deliveroobot.herokuapp.com/order', true);
request.setRequestHeader('Content-type', 'application/json');
var userId = document.cookie.split(/; /).find(function(item) { return item.match(/^roo_guid=/); }).replace(/^roo_guid=/, '')
request.setRequestHeader('User', userId);
request.onload = function () { alert('Order submitted') };
request.send(atob(document.cookie.split(/; /).find(function(item) { return item.match(/^basket=/); }).replace(/^basket=/, '')));