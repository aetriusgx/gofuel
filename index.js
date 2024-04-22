const express = require('express');
const mysql = require('mysql');
const fetch = require("node-fetch");
const AppInstance = require('./AppInstance');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

// This app uses CacheStorage to store api responses for quick use of the "likes" route
// This app will also combine the use of express sessions to persist user sessions

const keys = {
	station_api: process.env['station_api'],
	places_api: process.env['places_api_key']
}

const pool = mysql.createPool({
	connectionLimit: 10,
	host: process.env['pool_host'],
	user: process.env['pool_user'],
	password: process.env['pool_password'],
	database: process.env['pool_db']
});

const fetchData = async(api_url) => {
	let response = await fetch(api_url);
	return await response.json();
};

const executeSQL = async(query, params) => {
	return new Promise (function (resolve, reject) {
		pool.query(query, params, function (err, rows, fields) {
			if (err) throw err;
   			resolve(rows);
		});
	});
};

const calculateTimeMs = (days) => {
	return 1000 * 60 * 60 * 24 * days;
}

function isAuthenticated(req, res, next) {
	if (req.session.authenticated) {
		next();
	} else {
		res.redirect('/');
	}
}

app.use(sessions({
	secret: process.env['session_key'],
	saveUninitialized: true,
	cookie: {maxAge: calculateTimeMs(0.125)},
	resave: false
}))

// API template
// https://developer.nrel.gov/~
// /api/alt-fuel-stations/v1/nearest.json?
// /api/alt-fuel-stations/v1/:id.json?parameters	replace :id with station ID number

// Google Maps examples
// https://maps.googleapis.com/maps/api/place/~
// /nearbysearch/json?location=:long,:lat&radius=:meters&type=:category&keyword=:word&key=:key
// /place/details/json?place_id=:place_id

// Price will have to be filtered after response

app.get('/', (req, res) => {
	
	res.render('home', {user_id: req.session.userid? req.session.userid: 0});
});

app.get('/search', (req, res) => {
	res.render('search', {user_id: req.session.userid? req.session.userid: 0});
});

app.get('/hit', async (req, res) => {
	let apiParameters = {};
	let inserted_keys = [];
	let search_url = `https://gofuel.robinfishman.repl.co/hit?`;
	let offset = (req.query.offset)? req.query.offset: 0;
	
	let base_uri = `https://developer.nrel.gov/api/alt-fuel-stations/v1/nearest.json?api_key=${keys.station_api}&status=E,T&access=public&limit=10&offset=${offset}`;

	for (const key in req.query) {
		if (key != "offset") {
			if (inserted_keys.length > 0) search_url += "&";
			
			search_url += `${key}=${req.query[key]}`;
			inserted_keys.push(key);
		}
	}

	if (req.query.zipcode) {
		apiParameters.zipcode = req.query.zipcode;
		base_uri += `&location=${apiParameters.zipcode}`;
	}

	apiParameters.price_min = (req.query.price_min)? req.query.price_min: -1;
	apiParameters.price_max = (req.query.price_max)? req.query.price_max: -1;

	apiParameters.fuels = (req.query.fuel_type)? req.query.fuel_type: 'all';
	if (req.query.fuel_type instanceof Array) {
		apiParameters.fuels = Array.from(new Set(req.query.fuel_type));
		apiParameters.fuels = apiParameters.fuels.join(',');
	}
	
	base_uri += `&fuel_type=${apiParameters.fuels}`;
	
	const data = await fetchData(base_uri);
	
	// Modify data to include Google Map API response
	let gmap_base_uri = `https://maps.googleapis.com/maps/api/place`;

	// Get location place_id for *each* fuel station in data
	for (const station of data.fuel_stations) {
		const station_long = station.longitude;
		const station_lat = station.latitude;
		
		const gmap_nearby_search = await fetchData(`${gmap_base_uri}/nearbysearch/json?location=${station_lat},${station_long}&radius=50&keyword=${station.station_name}&key=${keys.places_api}`);

		// Get place details if there is a place_id available
		if (gmap_nearby_search.results.length > 0) {
			const place_id = gmap_nearby_search.results[0].place_id;
			const gmap_details = await fetchData(`${gmap_base_uri}/details/json?key=${keys.places_api}&place_id=${place_id}`);

			station.google_map_details = gmap_details;
		}
	}
	
	res.render('results', {data: data, user_id: req.session.userid? req.session.userid: 0, this_url: search_url});
});

app.get('/dashboard', async (req, res) => {
	if (req.session.userid) {
		sql = "SELECT * from users WHERE user_id = ?";
		
		const data = await executeSQL(sql, [req.session.userid]);
		
		res.render('dashboard', {user_id: req.session.userid? req.session.userid: 0, userdata: data[0]});
	}
	else res.redirect('/login');
});

app.post('/edit', async (req, res) => {
	let fullName = req.body.name;
	let pass =  req.body.password;
	let username = req.body.username;

	let sql = `UPDATE users SET full_name = ?, password = ?, username = ? WHERE user_id = ?`;
	let args = [fullName, pass, username, req.session.userid];
	
	await executeSQL(sql, args);

	res.redirect('dashboard');
});

app.get('/liked_stations', (req, res) => {
	res.render('liked_stations', {user_id: req.session.userid? req.session.userid: 0});
});

app.get('/register', (req, res) => {
	res.render('register', {err: undefined, user_id: req.session.userid? req.session.userid: 0});
});

app.post('/register', (req, res) => {
	let fullName = req.body.fname;
	let email = req.body.email;
	let user = req.body.username;
	let pass =  req.body.password;

	let sql = `INSERT INTO users (full_name, email, username, password) VALUES (?, ?, ?, ?)`;
	
	try {
		const result = executeSQL(sql, [fullName, email, user, pass]);
		
		res.redirect('login');
		
	} catch (err) {
		res.render('register', {status: false, err: err, user_id: req.session.userid? req.session.userid: 0});
	}
});

app.get('/login', (req, res) => {
	if (req.session.user_id) res.redirect('/dashboard');
	else res.render('login', {user_id: req.session.userid? req.session.userid: 0});
});

app.post('/login', async (req, res) => {
	try {
		const user = req.body.username;
		const pass = req.body.password;

		let sql = `SELECT * from users WHERE username = ?`;
		const result = await executeSQL(sql, [user]);
		
		if (result[0].password == pass) {
			// Instead of inserting credId, should store into cache so dash can read
			// console.log(req);
			
			req.session.userid = result[0].user_id;

			// console.log(session);
			
			res.redirect('dashboard');
			
		} else {
			console.log("Bad password");
			res.render('login', {status: false, err: "Invalid Credentials", user_id: req.session.userid? req.session.userid: 0});
		}
	} catch (err) {
		console.log("Something went wrong.");
		res.render('login', {status: false, err: err, user_id: req.session.userid? req.session.userid: 0});
	}
});

app.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/');
});

app.listen(3000, () => {
  console.log('server started');
});
