var request = new XMLHttpRequest();
request.open('GET', 'http://localhost:3000/order/' + btoa(window.location.pathname), true);
request.onload = function (data) {
    document.cookie = 'basket='+btoa(request.responseText)+'; path=/';
};
request.send();