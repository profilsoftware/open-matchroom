from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """Project-wide pagination: 24 per page, overridable via ``?page_size=``."""

    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 100
