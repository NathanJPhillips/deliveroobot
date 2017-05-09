var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var atob = require('atob')
var mongoose = require('mongoose');
var _ = require('lodash');
var request = require('request');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/deliveroobot');

var app = express();
app.use(cors({origin: 'https://deliveroo.co.uk'}));
app.use(bodyParser.json());
app.use(express.static('static'));

var Order = mongoose.model('Order', { 
  userId: String,
  date: Date,
  userName: String,
  description: String,
  order: mongoose.Schema.Types.Mixed,
  newApi: Boolean,
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/order/:restaurant_path', function (req, res) {
  var restaurantPath = atob(req.params.restaurant_path);
  var date = new Date();
  date.setHours(0, 0, 0, 0); 
  
  Order.find({date: date}, function(err, orders) {
    if (err) {
      res.status(500)
      return res.send('Database error: couldn\'t load orders');
    }
    orders = orders.map(function(order) { return order.order; })
      .filter(function(order) { return order.url === restaurantPath; });

    if (orders.length === 0) {
      res.status(500)
      return res.send('No orders found');
    }

    var order = orders.reduce(function(combinedOrder, order) {
      order.items.forEach(function(item) {
        var existing = !item.m && combinedOrder.items.find(function(existing) { return existing.i === item.i && !existing.m; });
        if (existing) {
          existing.q += item.q;
        } else {
          combinedOrder.items.push(item);
        }
      });
      return combinedOrder;
    });

    order.subTotal = 0;
    order.tip = 0;

    res.json(order);
  });
});

app.post('/order', function (req, res) {
  var date = new Date();
  date.setHours(0,0,0,0);  
  Order.findOneAndUpdate(
    {userId: req.body.userId, date: date}, 
    _.set(_.pick(req.body, ['userId', 'userName', 'description', 'order', 'newApi']), 'date', date),
    {upsert: true, passRawResult: true}, 
    function (err, order, raw) {
      if (err) {
        res.status(500)
        return res.send('Database error: couldn\'t save order');
      }
      res.send('Ok');

      var orderAction = raw.lastErrorObject.updatedExisting ? 'updated' : 'submitted';
      request.post({
        url: "https://hooks.slack.com/services/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",
        headers: {"Content-Type": "application/json"},
        body: {
          username: 'Deliveroobot',
          icon_url: 'https://deliveroobot.herokuapp.com/slack-icon.png',
          text: 'Order ' + orderAction + ' for ' + req.body.userName + ':\n' + req.body.description},
        json: true
      });
    }
  );
});

app.listen(process.env.PORT || 3000);