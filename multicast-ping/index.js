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

const amqp = require('rhea');
var receiver;
var sender;
var reply_addr;

amqp.options.enable_sasl_external = true;

amqp.on('message', function (context) {
    console.log(context.message.body);
});

amqp.on('receiver_open', function(context) {
    reply_addr = receiver.source.address;
    setTimeout(ping, 500);
});

const ping = function() {
    if (sender.credit > 0) {
        sender.send({reply_to: reply_addr, body:'ping request'});
        console.log("\nProbe request sent:");
        console.log("===================");
    } else {
        console.log('No probe due to absence of receivers.')
    }
    setTimeout(ping, 1000 * 5);
}

var connection = amqp.connect();
receiver = connection.open_receiver({source:{dynamic:true}});
sender   = connection.open_sender('mc.echo');


