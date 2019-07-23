// Copyright 2019 Google Inc.
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

const container = require('@google-cloud/container');
const {JWT} = require('google-auth-library');
const k8s = require('@kubernetes/client-node');
const request = require('request');
var keyFile = './agones-pingda-sandbox-e09847394108.json';

function getCluster(keyFile, project, zone, cluster_name)
{
    return new Promise((resolve, reject) => {
        const client = new container.v1.ClusterManagerClient({'keyFileName': keyFile});
        client.getCluster({'name': `projects/${project}/locations/${zone}/clusters/${cluster_name}`}).then((ret) => {
            resolve({
                'caData': ret[0].masterAuth.clusterCaCertificate, 
                'server': `https://${ret[0].endpoint}`, 
                'skipTLSVerify': false,
                'name': 'loaded-context'});
        }).catch((error) => {
            console.error(error);
            reject(error);
        })
    });
}

function getUser(keyFile)
{
    const googleServiceAccountKey = require(keyFile);

    return new Promise((resolve, reject) => {
        const googleJWTClient = new JWT(
            googleServiceAccountKey.client_email,
            null,
            googleServiceAccountKey.private_key,
            ['https://www.googleapis.com/auth/cloud-platform'],
            null,
        );

        googleJWTClient.authorize((error, access_token) => {
            if (error) {
                console.error(error);
                reject(error);
            }
            var ret = {"authProvider":{"config": null,"name":"gcp"}, 'name': 'loaded-context'};
            ret.authProvider.config = {'access-token': access_token.access_token, 'expiry': new Date(access_token.expiry_date).toISOString()};
            resolve(ret);
       });
    });
}

Promise.all([
        getCluster(keyFile, 'pingda-sandbox', 'us-central1-c', 'agones'), 
        getUser(keyFile)
    ]).then((result) => {
    const cluster = result[0];
    const user = result[1];

    const k8s = require('@kubernetes/client-node');
    const request = require('request');

    const kc = new k8s.KubeConfig();
    const opts = {};

    kc.loadFromClusterAndUser(cluster, user);
    kc.applyToRequest(opts);

    request.get(`${kc.getCurrentCluster().server}/apis/stable.agones.dev/v1alpha1/namespaces/default/fleets`, opts,
    (error, response, body) => {
        if (error) {
            console.log(`error: ${error}`);
        }

        var obj = JSON.parse(body);
        console.log(obj, obj.items[0].metadata, obj.items[0].spec);
        var ret = [];
        obj.items.forEach((v) => {
            ret.push(Object.assign({}, {'name': v.metadata.name, 'scheduling': v.spec.scheduling}, v.status))
        });
        console.log(ret);
    });
}).catch((error) => {
    console.error(error);
});