# agones-examples
Provided Agones APIs on Google Cloud Functions for easy of use:
* Get Fleet
* Get Gameserver
* Allocate Gameserver
* Scale (up/down) Fleet

## IAM Setup

* Setup Service Account for Agones GKE cluster 
```
% gcloud beta iam service-accounts create agones-cloudfunction \
--description "Agones API on Cloud Functions" \
--display-name "agones-cloudfunction"
```

* Setup Service Account IAM permissions
```
% gcloud projects add-iam-policy-binding <your project id> \
  --member serviceAccount:agones-cloudfunction@<your project id>.iam.gserviceaccount.com \
  --role roles/container.developer
```

## Cloud Functions Installation

(While prompting `Allow unauthenticated invocations of new function [getFleet]? (y/N)?` please answer No)

* Deploy getFleet

```
gcloud beta functions deploy getFleet --runtime nodejs8 \
--trigger-http --service-account=agones-cloudfunction<your project id>.iam.gserviceaccount.com
```

* Deploy getGameserver

```
gcloud beta functions deploy getGameserver --runtime nodejs8 \
--trigger-http --service-account=agones-cloudfunction@<your project id>.iam.gserviceaccount.com
```

* Deploy setGameserverAllocate

```
gcloud beta functions deploy setGameserverAllocate --runtime nodejs8 \
--trigger-http --service-account=agones-cloudfunction@<your project id>.iam.gserviceaccount.com
```

* Deploy setGameserverReplica

```
gcloud beta functions deploy setGameserverReplica --runtime nodejs8 \
--trigger-http --service-account=agones-cloudfunction@<your project id>.iam.gserviceaccount.com
```

## Testing

Since we've disabled anonymous users' right to invoke these cloud functions, therefore we must use an IAM credential with a role
`roles/cloudfunctions.invoker` to invoke those functions.

To simulate an invoke via a service account credential:
```
% gcloud auth activate-service-account ACCOUNT
ACCESS_TOKEN="$(gcloud auth print-identity-token ACCOUNT)"
% curl -v -H "Authorization: Bearer $ACCESS_TOKEN" "YOUR CLOUD FUNCTION URL HERE"
```

To simulate an invoke via a normal account:
```
% gcloud functions call FUNCTION_NAME --data '<YOUR QUERY PARAMETERS IN JSON FORMAT>'
```