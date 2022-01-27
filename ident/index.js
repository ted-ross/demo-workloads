/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/

"use strict";

const express = require('express');
const amqp = require('rhea');

var app = express();
var reply_receiver;
var management_sender;
const host = process.env.HOSTNAME;
var site = "unknown site";
var reply_to;

amqp.options.enable_sasl_external = true;

const fix_site_name = function(in_name) {
    let pos = in_name.indexOf('-skupper-router');
    if (pos > 0) {
        return in_name.substr(0, pos);
    }
    return in_name;
}

amqp.on('message', function (context) {
    var msg = context.message;
    if (msg.application_properties.statusCode == 200) {
        let keys   = msg.body.attributeNames;
        let values = msg.body.results;
        if (keys[0] == 'name' && values.length == 1) {
            site = fix_site_name(values[0][0]);
            console.log(`Site name is ${site}`);
        }
    }
});

amqp.on('receiver_open', function(context) {
    reply_to = reply_receiver.source.address;
    var query = {
        reply_to       : reply_to,
        correlation_id : 1,
        application_properties: {
            operation  : 'QUERY',
            type       : 'org.amqp.management',
            entityType : 'org.apache.qpid.dispatch.router'
        },
        body : {
            attributeNames : ['name']
        }
    };
    management_sender.send(query);
});

console.log('Identity Responder');
var connection = amqp.connect();
reply_receiver    = connection.open_receiver({source:{dynamic:true}})
management_sender = connection.open_sender('$management');

app.get('/api', function (req, res) {
    res.end(`Ident running in pod "${host}" at Skupper site "${site}"`);
});

var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Listening on http://%s:%s", host, port)
});

