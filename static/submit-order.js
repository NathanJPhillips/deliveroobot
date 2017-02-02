var request = new XMLHttpRequest();
request.open('POST', 'https://deliveroobot.herokuapp.com/order', true);
request.setRequestHeader('Content-type', 'application/json');
var userId = document.cookie.split(/; /).find(function(item) { return item.match(/^roo_guid=/); }).replace(/^roo_guid=/, '')
request.setRequestHeader('User', userId);
request.onload = function () { alert('Order submitted') };
var basket = document.cookie.split(/; /).find(function(item) { return item.match(/^basket=/); });
if (basket) {
    request.send(atob(basket.replace(/^basket=/, '').replace(/\.+$/, '=')));
} else {
    alert('Please add something to your basket')
}