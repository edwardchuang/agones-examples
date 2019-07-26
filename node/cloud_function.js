/**
 * Copyright 2019, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

let Agones = require('./agones');

exports.getFleet = (req, res) => {
    const parameter = {
        'project_id': req.get('project_id'),
        'zone': req.get('zone'),
        'cluster_name': req.get('cluster_name'),
    }
    const agones = new Agones(parameter);
    agones.getFleet().then((ret) => {
        res.write(ret);
    })
}
