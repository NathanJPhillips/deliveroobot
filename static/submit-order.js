var request = new XMLHttpRequest();
request.open('POST', 'https://deliveroobot.herokuapp.com/order', true);
request.setRequestHeader('Content-type', 'application/json');
var userId = document.cookie.split(/; /).filter(function(item) { return item.match(/^roo_guid=/); })[0].replace(/^roo_guid=/, '');

var userName = localStorage.getItem('name');
while (!userName || userName === 'null') {
    userName = prompt("Please enter your name: ");
}
localStorage.setItem('name', userName);

var description = [].map.call(document.getElementsByClassName('oi-details'), function(item) {
    return item.innerText.replace(/(\r\n|\r|\n)+$/, '').replace(/(\r\n|\r|\n)+/g, ', ')
}).join('\n');

request.onload = function() { alert('Order submitted') };
var order = document.cookie.split(/; /).filter(function(item) { return item.match(/^basket=/); })[0];
if (order) {
    request.send(JSON.stringify({
        userId: userId,
        userName: userName,
        description: description,
        order: JSON.parse(atob(order.replace(/^basket=/, '').replace(/\.+$/, ''))),
    }));
} else {
    alert('Please add something to your basket')
}