const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const port = 4000

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

const db = mongoose.createConnection();

db.openUri('mongodb+srv://mojoapi_db:AkB03c4F4D9Mx3Pg@cluster0.hboo7.mongodb.net/?retryWrites=true&w=majority',{useNewUrlParser: true,
useUnifiedTopology: true,});
mongoose.connection.on('error', err => {
  logError(err);
});

// app.get('/', (req, res) => {
//   db.collection('users').find({}).toArray().then(result => {
//     res.send(result)
//   }).catch(err => {
//     console.log(err);
//   })
//   // db.collection('users').drop()
//   // db.collection('payouts').drop()
//   // db.collection('deposits').drop()
// })

app.post('/signup', async (req, res) => {
  const {username, email, password, upline} = req.body
  const date = new Date()
  const hashPassword = await bcrypt.hash(password, 10);

  const date_obj = {
    month: date.getUTCMonth() +1,
    date: date.getDate(),
  }
  // JNSJNNmsdms

  const update_cDate = () => {
     var t = '' + date_obj.date + ''
    if ( t.length == 1)
    return  parseInt(date_obj.month+''+0+''+date_obj.date)
    else{
      return parseInt(date_obj.month+''+date_obj.date)
    }
  }
  const login = update_cDate();
  const getId = (await db.collection('users').find({}).toArray()).length

  const data = {
    id: getId +1,
    username, 
    email, 
    upline,
    balance: 0,
    password: hashPassword,
    ref: 0,
    ref_earning: 0,
    total_deposit: 0,
    total_payout: 0,
    login
  }

  // check username
  const checkUsername = await db.collection('users').find({username}).toArray();
  const countUsername = checkUsername.length
  // check email
  const checkEmail = await db.collection('users').find({email}).toArray();
  const countEmail = checkEmail.length

  // create response
  if(countUsername > 0) {
    res.send('username err')
  }
  if (countUsername == 0) {
    if(countEmail > 0) {
      res.send('email err')
    }
  }
  if (countUsername == 0 && countEmail == 0){
    db.collection('users').insertOne(data, (err, result) =>{
      if (err) throw err
      res.send('inserted')
    });
    const getUpline = await db.collection('users').find({id: parseInt(upline)}).toArray();
    if (getUpline .length > 0) {
      const getUplineRefs = parseInt(getUpline[0].ref);
      db.collection('users').updateOne({id: upline}, {$set: {ref: getUplineRefs +1}});
    }
  }
})


// LOGINs
app.post('/login', async (req, res) => {
  const {username, password} = req.body

  const findUser = await db.collection('users').find({username}).toArray();
  const countUser = findUser.length

  if (countUser == 1)  {
    const getHash = findUser[0].password
    const comparePass = await bcrypt.compare(password, getHash)
    
    if (comparePass) res.send(findUser);
    else res.send('invalid');
  }
  else res.send('invalid');
})

 
// DEPPOSIT
app.post('/deposit', async (req, res) => {
  // construct date
  const date = new Date()

  const date_obj = {
    month: date.getUTCMonth() +1,
    date: date.getDate(),
  }

  const update_cDate = () => {
     var t = '' + date_obj.date + ''
    if ( t.length == 1)
    return  parseInt(date_obj.month+''+0+''+date_obj.date)
    else{
      return parseInt(date_obj.month+''+date_obj.date)
    }
  }


  const count_depo = await db.collection('deposits').find({}).toArray()
  const deposit_data = {
    id: count_depo.length +1,
    amount: req.body.amount,
    email: req.body.email,
    hash: req.body.hash,
    status: 'pending',
    dep_date: update_cDate(),
    active: 0,
    Date: `${date.getDate()}-${date.getMonth() +1}-${date.getFullYear()}`
  };
  if (req.body.amount < 10) {res.send('err')}
  else{
    var hash = req.body.hash
    const findHash = await db.collection('deposits').find({hash}).toArray();
    const countHash = findHash.length

    if (countHash > 0) res.send('hash err')
    else{
      db.collection('deposits').insertOne(deposit_data, (err, result) => {
        if (err) throw err
        res.send('done');
      });
    }
  }
})

app.get('/getdeposit/:email', (req, res) => {
  const email = req.params.email

  db.collection('deposits').find({email}).toArray((err, result) => {
    if (err) throw err
    res.send(result);
  })
  // db.collection('deposits').drop()
})


app.post('/payout', async (req, res) => {
  const {amount, address, username} = req.body
  const date = new Date()
  const amt = parseInt(amount)

  db.collection('users').find({username}).toArray(async (err, result) => {
    if (err) throw err
    const getBal = parseInt(result[0].balance)
    const count_payout = await db.collection('payouts').find({}).toArray()
    const payout_data = {
    id: count_payout.length + 1,
    amount,  
    address,
    username,
    status: 'pending',
    Date: `${date.getDate()}-${date.getMonth() +1}-${date.getFullYear()}`
  }
  if (amt < 10) res.send("min err");
  if (amt > getBal) res.send('bal err');
  else{
    db.collection('payouts').insertOne(payout_data, (err, result) => {
      if (err) throw err;
      if (result.acknowledged == true){
        db.collection('users').updateOne({username}, {$set: {balance: getBal - amount}})
      }
      res.send("done");
    })
  }
  });
})
// njidjnj

app.get('/getpayout/:username', (req, res) => {
  const username = req.params.username

  db.collection('payouts').find({username}).toArray((err, result) => {
    if (err) throw err
    res.send(result);
  })
});




app.get('/pendeposit', (req, res) => {
  db.collection('deposits').find({status: 'pending'}).toArray((err, result) => {
    if (err) throw err
    res.send(result)
  })
})

app.get('/penwithdrawal', (req, res) => {
  db.collection('payouts').find({status: 'pending'}).toArray((err, result) => {
    if (err) throw err
    res.send(result)
  })
})


app.post('/condeposit', async (req, res) => {
  const {amount, email, id, status} = req.body;

  

  if(status == 'cancelled'){
  db.collection('deposits').updateOne({id}, {$set: {status}});
  }else{
    const getBal = await db.collection('users').find({email}).toArray();
    const cBal = parseInt(getBal[0].total_deposit); 
    const upline = getBal[0].upline;

    

    const commission = (10/100 * parseInt(amount));


    db.collection('users').updateOne({email}, {$set: {total_deposit: cBal + parseInt(amount)}});
    db.collection('deposits').updateOne({id}, {$set: {status}});

    if (upline !== null ){
      const get_upline_bal = await db.collection('users').find({id: upline}).toArray();
      const upline_bal = parseInt(get_upline_bal[0].balance)
      const te = parseInt(get_upline_bal[0].ref_earning)
      db.collection('users').updateOne({id: upline}, {$set: {balance: upline_bal + commission, ref_earning: te+commission}});
    }
    
    
  }
  res.send("done");
})

app.post('/conpayout', async (req, res) => {
  const {amount, username, id, status} = req.body;

  

  if(status == 'cancelled'){
  db.collection('payouts').updateOne({id}, {$set: {status}});
  }else{
    const getBal = await db.collection('users').find({username}).toArray();
    const cBal = getBal[0].total_payout; 


    db.collection('users').updateOne({username}, {$set: {total_payout: parseInt(cBal) + parseInt(amount)}});
    db.collection('payouts').updateOne({id}, {$set: {status}});
  }
  res.send("done");
})



app.post('/mine', async (req, res) => {
  const {email} = req.body

  const date = new Date()
  const date_obj = {  // object Constrution
    month: date.getUTCMonth() +1,
    date: date.getUTCDate(),
  } 

  const update_cDate = () => {
    var t = '' + date_obj.date + '';
    if ( t.length == 1)
    return  parseInt(date_obj.month+''+0+''+date_obj.date)
    else{
      return parseInt(date_obj.month+''+date_obj.date)
    }
  } //  Date

  // get user last login and balance
  const getUser = await db.collection('users').find({email}).toArray()
  const get_last_login = getUser[0].login;
  const user_cBal = getUser[0].balance

  // find deposit and filtering the active one
  const findDepo = await db.collection('deposits').find({email, status: 'confirmed'}).toArray();
  const fincActiveDepo = findDepo.filter(i => {
    return i.active <= 20
  });
  let total_investment = 0;
  for (i of fincActiveDepo) {
    total_investment += parseInt(i.amount)
  }

  // Daily Mining, and updating user last login
  const mining_formula = async (pLog) => {
    const days = update_cDate() - pLog;

    // function for updating deposit active days
    const updateActive =async  (id, days) => {
      const getActive = await db.collection('deposits').find({id}).toArray();
      const getActiveDays = parseInt(getActive[0].active)
      await db.collection('deposits').updateOne({id}, {$set: {active: getActiveDays + parseInt(days)}})
    }

    if (days !== 0){
      for (i of fincActiveDepo){
        updateActive(i.id, days)
      }
    }

    if (days > 30) {
      const commission = (total_investment * (10/100)) * (days - 70);
      db.collection('users').updateOne({email}, {$set: {balance: parseInt(user_cBal) + commission, login: update_cDate()}});
    }
    else{
      const commission = (total_investment * (10/100)) * days;
      db.collection('users').updateOne({email}, {$set: {balance: user_cBal + commission, login: update_cDate()}});
    }
    const getUser2 = await db.collection('users').find({email}).toArray()

  res.send(getUser2);
  } 
  mining_formula(get_last_login);

})


app.listen(process.env.PORT || port, () => {
  console.log('MojoMiner Api Running...')
})