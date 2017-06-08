var request = new XMLHttpRequest();
request.open('POST', 'https://deliveroobot.herokuapp.com/order', true);
request.setRequestHeader('Content-type', 'application/json');
request.onload = function() { alert('Order submitted') };
var userId = document.cookie.split(/; /).filter(function(item) { return item.match(/^roo_guid=/); })[0].replace(/^roo_guid=/, '');

var userName = localStorage.getItem('name');
while (!userName || userName === 'null') {
    userName = prompt("Please enter your name: ");
}
localStorage.setItem('name', userName);

var description = [].map.call(document.getElementsByClassName('oi-details'), function(item) {
    return item.innerText.replace(/(\r\n|\r|\n)+$/, '').replace(/(\r\n|\r|\n)+/g, ', ')
}).join('\n');

if (!description) {
    description = [].map.call(document.querySelectorAll('.menu-nav .basket-contents__item-list .basket-item'), function(item) {
        return item.innerText.replace(/(\r\n|\r|\n)+$/, '').replace(/(\r\n|\r|\n)+/g, ', ').replace(/^(\d+),/, '$1x').replace(/, £\d+.\d+$/, '').replace(/ +,/g, ',');
    }).join('\n');
}

var getOrder = function (deliverooData, callback) {
    var categories = {};
    deliverooData.menu.categories.map(function(category) {
        categories[category.id] = category;
    });

    var testItem = deliverooData.menu.items.filter(function(item) { 
        return item.modifier_groups.length === 0 && (categories[item.category_id] || {}).top_level;
    })[0];

    var addItem = new XMLHttpRequest();
    addItem.open('POST', 'https://deliveroo.co.uk/api/basket/items', true);
    addItem.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
    addItem.send(JSON.stringify({
        basket_item_info: {item: {item_id: testItem.id}},
        delivery_day: deliverooData.basket.scheduled_delivery_day || 'today',
        delivery_time: deliverooData.basket.scheduled_delivery_time.replace(/\s+/g, '') || deliverooData.delivery_hours.today[0].time,
        restaurant_id: deliverooData.restaurant.id,
    }));

    addItem.onload = function(data) {
        var basketData = JSON.parse(addItem.responseText).basket;

        var basketTestItem = basketData.items.filter(function(item) {
            return item.id.indexOf(testItem.id) === 0;
        })[0];

        var removeItem = new XMLHttpRequest();
        removeItem.open('POST', 'https://deliveroo.co.uk' + basketTestItem.decrement_item_url, true);
        removeItem.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
        removeItem.send(JSON.stringify({
            basket_item_info: {item: {basket_item_id: basketTestItem.id}},
            delivery_day: deliverooData.basket.scheduled_delivery_day || 'today',
            delivery_time: deliverooData.basket.scheduled_delivery_time.replace(/\s+/g, '') || deliverooData.delivery_hours.today[0].time,
            restaurant_id: deliverooData.restaurant.id,
        }));
        removeItem.onload = function(data) {
            callback(JSON.parse(removeItem.responseText).basket);
        };
    };
};

var reactComponent = document.querySelector('[data-component-name=MenuIndexApp]');
if (reactComponent) {
    var deliverooData = JSON.parse(reactComponent.innerHTML);

    getOrder(deliverooData, function(basketData) {
        if (basketData.items.length) {
            request.send(JSON.stringify({
                userId: userId,
                userName: userName,
                description: description || 'Order summary unavailable',
                order: basketData,
                newApi: true,
            }));
        } else {
            alert('Please add something to your basket')
        }
    });
}

else {
    var order = document.cookie.split(/; /).filter(function(item) { return item.match(/^basket=/); })[0];
    if (order) {
        request.send(JSON.stringify({
            userId: userId,
            userName: userName,
            description: description || 'Order summary unavailable',
            order: JSON.parse(atob(order.replace(/^basket=/, '').replace(/\.+$/, ''))),
            newApi: false,
        }));
    } else {
        alert('Please add something to your basket')
    }
}