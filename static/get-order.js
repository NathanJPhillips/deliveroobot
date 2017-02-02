var request = new XMLHttpRequest();
request.open('GET', 'https://deliveroobot.herokuapp.com/order/' + btoa(window.location.pathname), true);
request.onload = function (data) {
    document.cookie = 'basket='+btoa(request.responseText)+'; path=/';
    window.location.reload();
};
request.send();