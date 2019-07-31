// Copyright 2019 Google LLC All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

let Agones = require('./agones.js');

exports.getFleet = (req, res) => {
    const parameter = {
        zone: req.query.zone || req.body.zone,
        project_id: req.query.project_id || req.body.project_id,
        cluster_name: req.query.cluster || req.body.cluster
    }

    const agones = new Agones(parameter);
    agones.getFleet(req.query.fleet || req.body.fleet || undefined).then((ret) => {
        res.status(200).send(JSON.stringify(ret));
    }).catch((error) => {
        console.error(error);
        res.status(400).send('error');
    })
}

exports.getGameserver = (req, res) => {
    const parameter = {
        zone: req.query.zone || req.body.zone,
        project_id: req.query.project_id || req.body.project_id,
        cluster_name: req.query.cluster || req.body.cluster
    }

    const agones = new Agones(parameter);
    agones.getGameservers(req.query.fleet || req.body.fleet || undefined).then((ret) => {
        res.status(200).send(JSON.stringify(ret));
    }).catch((error) => {
        console.error(error);
        res.status(400).send('error');
    })
}

exports.setGameserverAllocate = (req, res) => {
    const parameter = {
        zone: req.query.zone || req.body.zone,
        project_id: req.query.project_id || req.body.project_id,
        cluster_name: req.query.cluster || req.body.cluster
    }

    const agones = new Agones(parameter);
    agones.setGameserverAllocate(req.query.fleet || req.body.fleet || undefined).then((ret) => {
        console.log(ret);
        res.status(200).send(JSON.stringify(ret));
    }).catch((error) => {
        console.error(error);
        res.status(400).send('error');
    })
}

exports.setGameserverReplica = (req, res) => {
    const parameter = {
        zone: req.query.zone || req.body.zone,
        project_id: req.query.project_id || req.body.project_id,
        cluster_name: req.query.cluster || req.body.cluster
    }

    if (req.query.replica == undefined || req.query.replica < 0) {
        res.status(400).send('error');
        return;
    }

    const agones = new Agones(parameter);
    agones.setGameserverReplica(req.query.fleet || req.body.fleet, req.query.replica).then((ret) => {
        res.status(200).send(JSON.stringify(ret));
    }).catch((error) => {
        console.error(error);
        res.status(400).send('error');
    })
}