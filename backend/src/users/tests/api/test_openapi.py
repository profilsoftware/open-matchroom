from http import HTTPStatus

import pytest
from django.urls import reverse


def test_api_docs_accessible_by_admin(admin_client):
    url = reverse("api-docs")
    response = admin_client.get(url)
    assert response.status_code == HTTPStatus.OK


@pytest.mark.django_db
def test_api_docs_not_accessible_by_anonymous_users(client):
    url = reverse("api-docs")
    response = client.get(url)
    # Cookie-JWT auth advertises a WWW-Authenticate header, so anonymous access
    # is rejected with 401 rather than 403.
    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_api_schema_generated_successfully(admin_client):
    url = reverse("api-schema")
    response = admin_client.get(url)
    assert response.status_code == HTTPStatus.OK
