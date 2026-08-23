
const http = require('http');

const data = JSON.stringify({ recipient_id: 1 });

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/conversations/dm',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer 1|xxx' // this won't work easily without a real token
  }
};
// I won't run this actually because getting a valid Sanctum token is hard in a quick script.

