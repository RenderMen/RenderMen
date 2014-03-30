#!/usr/bin/env python
# -*- coding: utf-8 -*-

import mongoengine
import os
import hashlib

def generate_salt():
    return os.urandom(16).encode('base_64')

def hash_password(password, salt):
    return hashlib.sha512(salt + password).hexdigest()

class User(mongoengine.Document):
    email = mongoengine.StringField(primary_key=True, unique=True)
    username = mongoengine.StringField(required=True, unique=True)

    salt = mongoengine.StringField(default=None)
    secret_hash = mongoengine.StringField(default=None)
    credits = mongoengine.IntField(default=50)
    pixels = mongoengine.LongField(default=0)
    picture = mongoengine.StringField()

    @staticmethod
    def new_user(email, username, password):
        salt = generate_salt()
        secret_hash = hash_password(password, salt)
        return User(email=email, username=username, salt=salt, secret_hash=secret_hash)

    def clean(self):
        # Emails and usernames are case-insensitive
        self.email = self.email.lower().strip()
        self.username = self.username.lower().strip()

        # Fetching pictures from gravatar
        self.picture = 'http://www.gravatar.com/avatar/{}'.format(hashlib.md5(self.email).hexdigest())

    @property
    def formatted_pixels(self):
        if self.pixels >= 1000000:
            return "{}M".format(self.pixels / 1000000.0)
        elif self.pixels >= 1000:
            return "{}K".format(self.pixels / 1000.0)
        else:
            return str(self.pixels)


    @property
    def formatted_credits(self):
        if self.credits >= 1000000:
            return "{}M".format(self.pixels / 1000000.0)
        elif self.credits >= 1000:
            return "{}K".format(self.pixels / 1000.0)
        else:
            return str(self.credits)

if __name__ == '__main__':
    user = User.new_user('test@test.com', 'mypassword')
    assert user.email == 'test@test.com'