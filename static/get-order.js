var getOrder = function(data, callback) {
    var deliverooData = JSON.parse(reactComponent.dataset.props);   

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
    addItem.setRequestHeader('authorization', 'Basic NjIxNDI5Njp3ZWIsMmJkMTM3ZWM2MTM2NDk3ZmE4ODQxYjkxMGVlYTQyYjE=');
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

var clearOrder = function (items, callback) {
    var item = items.pop();
    var deleteItem = new XMLHttpRequest();
    deleteItem.open('DELETE', 'https://deliveroo.co.uk/api/basket/items/' + item.id, true);
    deleteItem.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
    deleteItem.send(JSON.stringify({
        basket_item_info: {item: {basket_item_id: item.id}},
        delivery_day: deliverooData.basket.scheduled_delivery_day || 'today',
        delivery_time: deliverooData.basket.scheduled_delivery_time.replace(/\s+/g, '') || deliverooData.delivery_hours.today[0].time,
        restaurant_id: deliverooData.restaurant.id,
    }));
    deleteItem.onload = function(data) {
        if (items.length > 0) {
            clearOrder(items, callback);
        }
        else {
            callback();
        }
    };
};

var request = new XMLHttpRequest();
request.open('GET', 'https://deliveroobot.herokuapp.com/order/' + btoa(window.location.pathname), true);
request.onload = function (data) {
    var reactComponent = document.querySelector('[data-component-name=MenuIndexApp]');  
    if (reactComponent) {
        var deliverooData = JSON.parse(reactComponent.dataset.props);

        getOrder(deliverooData, function(basketData) {
            clearOrder(basketData.items, function() {
                console.log('Done!');
            });
        });
    } else {
        document.cookie = 'basket='+btoa(request.responseText)+'; path=/';
        window.location.reload();
    }
};
request.send();