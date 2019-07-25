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

class Agones {
    constructor(options) {
        this.keyFile = options.keyFile;
        this.project_id = options.project_id;
        this.zone = options.zone;
        this.cluster_name = options.cluster_name;
        this.namespaces = options.namespaces || 'default';
        this._cluster = null;
        this._user = null;
    }

    getBlah() {
        console.log(this._user);
    }

    refreshToken() {
        return new Promise((resolve, reject) => {
            Promise.all([this.getCluster(), this.getUser()]).then((result) => {
                this._cluster = result[0];
                this._user = result[1];
                resolve();
            }).catch((error) => {
                console.log('refreshToken', error);
                reject(error);
            })
        });
    }

    setGameserverAllocate(fleet) {
        return new Promise((resolve, reject) => {
            this.refreshToken().then(() => {
                const k8s = require('@kubernetes/client-node');
                const request = require('request');

                const kc = new k8s.KubeConfig();
                const opts = {};

                kc.loadFromClusterAndUser(this._cluster, this._user);
                const option = {
                    'url': `${kc.getCurrentCluster().server}/apis/allocation.agones.dev/v1alpha1/namespaces/${this.namespaces}/gameserverallocations`,
                    'method': 'POST',
                    'body': {
                        "apiVersion": "allocation.agones.dev/v1alpha1",
                        "kind": "GameServerAllocation",
                        "metadata": {"namespace": this.namespaces},
                        "spec": {
                            "required": {
                                "matchLabels": {
                                    "stable.agones.dev/fleet": fleet
                                }
                            }
                        }
                    },
                    'json': true
                }
                kc.applyToRequest(option);
                request(option, (error, response, body) => {
                    if (error) {
                        console.log(response, body, `error: ${error}`);
                    }
                    var ret = {};
            
                    if (body.status.state == 'Allocated') {
                        ret = {'name': body.status.gameServerName, 'address': body.status.address, 'node': body.status.nodeName, 'port': body.status.ports[0].port};
                        console.log(ret);
                    } else if (body.status.state == 'UnAllocated') {
                        ret = {'name': '', 'error': 'Unable to allocate a gameserver'};
                        console.log(ret);
                    } else {
                        ret = {'name': '', 'error': 'Unknown error, no gameserver(s) allocated'};
                        console.log(ret);
                    }
                    resolve(ret);
                });
            }).catch((error) => {
                console.error(error);
                reject(error);
            })
        });
    }

    setGameserverReplica(fleet, replicas) {
        return new Promise((resolve, reject) => {
            Promise.all([this.getFleet(fleet), this.refreshToken()]).then((ret) => {
                var data = {
                    "kind": "Scale",
                    "apiVersion": "autoscaling/v1",
                    "metadata": ret[0][0].items[0].metadata,
                    "spec":{
                        "replicas": replicas
                    }
                };
            
                console.log('data', data);
            
                const k8s = require('@kubernetes/client-node');
                const request = require('request');
            
                const kc = new k8s.KubeConfig();
                kc.loadFromClusterAndUser(this._cluster, this._user);
            
                const option = {
                    'url': `${kc.getCurrentCluster().server}/apis/stable.agones.dev/v1alpha1/namespaces/${this.namespaces}/fleets/${fleet}/scale`,
                    'method': 'PUT',
                    'body': data,
                    'json': true
                }
                kc.applyToRequest(option);
            
                request(option, (error, response, body) => {
                    if (error) {
                        console.log(response, body, `error: ${error}`);
                    }
                    console.log('body', body);
                    resolve(body);
                });
            }).catch((error) => {
                console.error(error);
                reject(error);
            })
        });
    }

    getFleet(fleet = 'agones') {
        return new Promise((resolve, reject) => {
            this.refreshToken().then(() => {
                const k8s = require('@kubernetes/client-node');
                const request = require('request');

                const kc = new k8s.KubeConfig();
                const opts = {};

                kc.loadFromClusterAndUser(this._cluster, this._user);
                kc.applyToRequest(opts);

                request.get(`${kc.getCurrentCluster().server}/apis/stable.agones.dev/v1alpha1/namespaces/${this.namespaces}/fleets`, opts,
                (error, response, body) => {
                    if (error) {
                        console.log(`error: ${error}`);
                    }

                    var obj = JSON.parse(body);
                    var ret = [];
                    obj.items.forEach((v) => {
                        if (fleet == null || v.metadata.name == fleet) {
                            ret.push(obj)
                        }
                    });
                    console.log(ret);
                    resolve(ret);
                });
            }).catch((error) => {
                console.error(error);
                reject(error);
            })
        });
    }

    getGameservers() {
        return new Promise((resolve, reject) => {
            this.refreshToken().then(() => {
                const k8s = require('@kubernetes/client-node');
                const request = require('request');

                const kc = new k8s.KubeConfig();
                const opts = {};

                kc.loadFromClusterAndUser(this._cluster, this._user);
                kc.applyToRequest(opts);

                request.get(`${kc.getCurrentCluster().server}/apis/stable.agones.dev/v1alpha1/namespaces/${this.namespaces}/gameservers`, opts,
                (error, response, body) => {
                    if (error) {
                        console.log(`error: ${error}`);
                    }

                    var obj = JSON.parse(body);
                    var ret = [];
                    obj.items.forEach((v, k) => {
                        ret.push({'name': v.metadata.name, 'node': v.status.nodeName, 'address': v.status.address, 'port': v.status.ports[0].port});
                    });
                    console.log(ret);
                    resolve(ret);
                });
            }).catch((error) => {
                console.error(error);
                reject(error);
            });
        });
    }

    getCluster() {
        return new Promise((resolve, reject) => {
            const client = new container.v1.ClusterManagerClient({'keyFileName': this.keyFile});
            client.getCluster({'name': `projects/${this.project_id}/locations/${this.zone}/clusters/${this.cluster_name}`}).then((ret) => {
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

    getUser() {
        const googleServiceAccountKey = require(`./${this.keyFile}`);

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
                ret.authProvider.config = {
                    'access-token': access_token.access_token, 
                    'expiry': new Date(access_token.expiry_date).toISOString()
                };
                resolve(ret);
            });
        });
    }

}

module.exports = Agones;

var d = new Agones({
    keyFile: 'agones-pingda-sandbox-e09847394108.json',
    project_id: 'pingda-sandbox',
    zone: 'us-central1-c',
    cluster_name: 'agones' 
});

d.setGameserverReplica('xonotic', 3);
