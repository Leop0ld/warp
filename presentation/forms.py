import re

from django import forms
from django.core.exceptions import ValidationError
from django.forms import RadioSelect

from .models import Presentation, Slide, Tag


class PresentationBaseForm(forms.ModelForm):
    subject = forms.CharField(max_length=50)
    tags = forms.CharField()
    markdown = forms.CharField(widget=forms.HiddenInput(), required=True)
    is_public = forms.BooleanField(initial=True,
                                   required=False,
                                   widget=RadioSelect(choices=[
                                       (True, 'public'), (False, 'private')]))

    def clean_tags(self):
        tags_text = self.cleaned_data['tags']
        tag_names = self.split_tags(tags_text)
        for tag_name in tag_names:
            tag_name.strip()
            if len(tag_name) < 0 or len(tag_name) > 16:
                raise ValidationError("Tag is too long.")

        return tags_text

    def save(self, commit=True):
        pass

    def add_slide_list(self, presentation):
        markdown = self.cleaned_data.get('markdown')

        slide_list = re.split("={5,}", markdown)

        Slide.objects.filter(presentation=presentation).delete()
        for order_num, slide in enumerate(slide_list):
            Slide.objects.create(
                presentation=presentation,
                slide_order=order_num,
                markdown=slide
            )

    def add_tags(self, presentation):
        tags_text = self.cleaned_data['tags']
        tag_names = self.split_tags(tags_text)
        for tag_name in tag_names:
            tag_name.strip()
            if 0 < len(tag_name) < 16:
                tag = self.create_and_get_tag(tag_name)
                presentation.tags.add(tag)

    @staticmethod
    def create_and_get_tag(tag_name):
        try:
            tag = Tag.objects.get(name=tag_name)
        except Tag.DoesNotExist:
            Tag.objects.create(name=tag_name)
            tag = Tag.objects.get(name=tag_name)
        return tag

    @staticmethod
    def split_tags(tags_text):
        # re.split('a, b c,d', param) -> result: ['a','b','c','d']
        tag_split_regex = ',\s|,|\s'
        return re.split(tag_split_regex, tags_text)

    class Meta:
        model = Presentation
        fields = ['subject', 'markdown', 'is_public', 'tags']


class PresentationCreateForm(PresentationBaseForm):
    def save(self, commit=True):
        presentation = Presentation.objects.create(
            subject=self.cleaned_data.get('subject'),
            author=self.user,
            is_public=self.cleaned_data.get('is_public')
        )

        self.add_slide_list(presentation)
        self.add_tags(presentation)
        return presentation


class PresentationUpdateForm(PresentationBaseForm):
    def save(self, commit=True):
        self.instance.subject = self.cleaned_data.get('subject')
        self.instance.is_public = self.cleaned_data.get('is_public')
        self.instance.save()

        self.add_slide_list(self.instance)
        self.add_tags(self.instance)
        return self.instance
