var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var atob = require('atob')
var mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/deliveroobot');

var app = express();
app.use(cors({origin: 'https://deliveroo.co.uk'}));
app.use(bodyParser.json());
app.use(express.static('static'));

var Order = mongoose.model('Order', { userId: String, date: Date, order: mongoose.Schema.Types.Mixed });

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
        var existing = combinedOrder.items.find(function(existing) { return existing.i === item.i; });
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
  var userId = req.get('User');
  var order = req.body;
  if (!userId) {
      res.status(500)
      return res.send('User header not provided');
  }
  var date = new Date();
  date.setHours(0,0,0,0);  
  Order.findOneAndUpdate(
    {userId: userId, date: date}, 
    {userId: userId, date: date, order: order}, 
    {upsert: true}, 
    function (err, doc) {
      if (err) {
        res.status(500)
        return res.send('Database error: couldn\'t save order');
      }
      res.send('Ok');
    }
  );
});

app.listen(process.env.PORT || 3000);