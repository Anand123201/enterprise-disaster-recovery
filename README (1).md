# Enterprise Disaster Recovery System

A practical disaster-recovery and deployment-strategy project
demonstrating application availability, database backup and restoration,
failover, automated testing, Blue-Green deployment, GitOps delivery,
Kubernetes secret management, and Canary traffic routing.

## Project objectives

-   Demonstrate how an application can remain available when an
    application instance fails.
-   Back up and restore PostgreSQL data.
-   Automate application tests in a CI/CD workflow.
-   Switch production traffic between Blue and Green environments.
-   Use Git as the source of truth for Kubernetes deployments with Argo
    CD.
-   Keep database credentials out of application deployment manifests by
    using Kubernetes Secrets.
-   Gradually route a small share of traffic to a Canary backend and
    roll back to the stable Green backend when needed.

## Technology stack

  Area                              Technologies
  --------------------------------- ---------------------------------
  Application                       Node.js, Express
  Database                          PostgreSQL
  Containers                        Docker, Docker Compose
  Reverse proxy / traffic routing   NGINX
  Orchestration                     Kubernetes
  GitOps                            Argo CD
  CI/CD testing                     GitHub Actions, Jest, Supertest
  Source control                    Git, GitHub

## Repository structure

``` text
enterprise-disaster-recovery/
├── app/                         # Application source code
├── backups/                     # Local database backup artifacts (if present)
├── k8s/                         # Kubernetes manifests
├── nginx/                       # NGINX reverse-proxy configuration
├── reports/                     # Assignment reports for Tasks 1–7
├── tests/                       # Automated application tests
├── .github/workflows/           # CI/CD workflow definitions
├── docker-compose.yml           # Local multi-container environment
├── Dockerfile                   # Application container image
├── init.sql                     # Database initialization script (if present)
├── package.json                 # Node.js dependencies and scripts
└── README.md
```

The exact folders and files may vary slightly depending on the current
project checkout.

## Run locally with Docker Compose

### Prerequisites

-   Docker Desktop installed and running
-   Git
-   PowerShell (Windows) or a terminal

### Start the application

From the repository root:

``` powershell
docker compose config
docker compose up -d --build
docker compose ps
```

The Compose environment includes the PostgreSQL database, application
environments, and NGINX reverse proxy as defined in
`docker-compose.yml`.

Open the local application endpoint:

``` text
http://localhost:8081
```

The application responds with JSON identifying the environment serving
the request.

### View logs and stop the environment

``` powershell
docker compose logs
docker compose logs nginx
docker compose ps
docker compose down
```

To stop the containers while retaining named volumes, use
`docker compose down`. Do not add `-v` unless you intentionally want to
remove Compose-managed volumes and their stored data.

## Blue-Green deployment

The project uses separate Blue and Green application environments. NGINX
routes requests to the configured production backend. The active backend
can be changed by updating the NGINX upstream configuration and
reloading NGINX.

Validate and reload NGINX:

``` powershell
docker exec recovery-nginx nginx -t
docker exec recovery-nginx nginx -s reload
```

Test the endpoint:

``` powershell
Invoke-RestMethod http://localhost:8081
```

The JSON response includes the active environment name and application
status.

## Canary deployment demonstration

The local Compose demonstration configures NGINX weighted upstreams to
send approximately 90% of requests to Green and 10% to Canary:

``` nginx
upstream production_backend {
    server green:3000 weight=9;
    server canary:3000 weight=1;
}
```

After changing the NGINX configuration, validate and reload it:

``` powershell
docker exec recovery-nginx nginx -t
docker exec recovery-nginx nginx -s reload
```

Send a sample of requests and inspect the returned environment:

``` powershell
1..30 | ForEach-Object {
    (Invoke-RestMethod http://localhost:8081).server
}
```

The configured weights represent an approximate distribution over
multiple requests; they do not guarantee an exact percentage in a small
sample.

### Canary rollback

To stop sending traffic to Canary, configure the upstream to use Green
only:

``` nginx
upstream production_backend {
    server green:3000;
}
```

Then validate, reload, and test:

``` powershell
docker exec recovery-nginx nginx -t
docker exec recovery-nginx nginx -s reload

1..20 | ForEach-Object {
    (Invoke-RestMethod http://localhost:8081).server
}
```

The expected result is that all requests are served by
`Green Environment`. This changes traffic routing; it does not delete or
stop the Canary container.

## Kubernetes and GitOps

Kubernetes manifests are stored in the `k8s/` directory. The project
uses Blue and Green deployments, Services, PostgreSQL resources, and a
Canary deployment resource. Argo CD monitors the Git repository and
reconciles the Kubernetes cluster with the committed manifests.

Useful inspection commands:

``` powershell
kubectl get deployments
kubectl get services
kubectl get pods
kubectl get all
```

Check the Argo CD application status using the Argo CD interface or CLI
available in your environment. Confirm that the application is Healthy
and Synced after manifest changes.

## Secret management

The Kubernetes deployment configuration uses a Kubernetes Secret named
`recovery-db-secret` for database credentials. Deployments reference the
Secret through `secretKeyRef` rather than embedding the database
password directly in the manifest.

Do not commit real passwords, API keys, tokens, or private credentials
to GitHub. Use local environment configuration or a secure secret store
for sensitive values.

## Automated tests

Install dependencies and run the test suite using the scripts defined in
`package.json`:

``` powershell
npm install
npm test
```

The repository includes automated tests and a GitHub Actions workflow
under `.github/workflows/` (if present in the current checkout). A
successful local test run does not replace checking the workflow result
on GitHub Actions.

## Disaster recovery: backup and restore

The project report documents PostgreSQL backup and restoration using
`pg_dump` and `pg_restore`. A typical custom-format backup command is:

``` powershell
docker exec recovery-db pg_dump -U admin -d enterprise_db -F c -f /tmp/enterprise_backup.dump
```

Copy the backup from the container to the local `backups/` directory:

``` powershell
docker cp recovery-db:/tmp/enterprise_backup.dump .\backups\enterprise_backup.dump
```

Restore procedures can overwrite existing data. Verify the target
database and backup file before running any restore command, and follow
the documented recovery procedure for this project.

## Assignment reports

The `reports/` directory contains the PDF submissions for the seven
Enterprise Disaster Recovery tasks:

1.  Disaster Recovery Mechanism
2.  Automated Testing within a CI/CD Pipeline
3.  Blue-Green Deployment Strategy
4.  GitOps-based Delivery
5.  Advanced Deployment Strategies
6.  Secret Management
7.  Canary Deployment Strategy

Open the PDFs in `reports/` for implementation steps, screenshots,
observations, and task-specific evidence.

## Monitoring and rollback considerations

For a Canary rollout, monitor at least:

-   HTTP error rate
-   Response latency compared with the stable environment
-   Canary container and application health
-   Database connectivity
-   Correctness of application responses

The project exercise defines example rollback triggers such as an error
rate above 2%, latency more than 20% above baseline,
unhealthy/restarting Canary instances, database connection failures, or
incorrect application responses. These are demonstration thresholds, not
measured production service-level objectives. A production rollout
should set thresholds based on a measured baseline and an agreed
monitoring window.

## Important notes

-   The NGINX Compose weighted-upstream demonstration is a lab
    traffic-routing setup, not a production-grade user-targeted
    traffic-splitting platform.
-   Weighted routing is approximate over a request sample.
-   Keep backups outside disposable containers and test restoration
    regularly.
-   Never publish real credentials or sensitive data in the repository.
-   Review `docker-compose.yml`, Kubernetes manifests, and NGINX
    configuration before applying changes to a shared or production
    environment.

## Author

**Anand Kumar**\
Enterprise Disaster Recovery Project
