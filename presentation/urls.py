from django.conf.urls import url

from . import views

urlpatterns = [
    url(
        regex=r'^$',
        view=views.PresentationList.as_view(),
        name='list'
    ),
    url(
        regex=r'^create$',
        view=views.presentation_create,
        name='create'
    ),
    url(
        regex=r'^detail/(?P<pk>\d+)$',
        view=views.PresentationDetail.as_view(),
        name='detail'
    )
]
