import mongoengine
import os
import hashlib

def generate_salt():
    return os.urandom(16).encode('base_64')

def hash_password(password, salt):
    return hashlib.sha512(salt + password).hexdigest()

class User(mongoengine.Document):
    email = mongoengine.StringField(primary_key=True)
    password = mongoengine.StringField(required=True)
    salt = mongoengine.StringField(required=True)
    secret_hash = mongoengine.StringField(required=True)
    credits = mongoengine.IntField(default=50)

    @staticmethod
    def new_user(email, password):
        salt = generate_salt()
        secret_hash = hash_password(password, salt)
        return User(email=email, salt=salt, secret_hash=secret_hash)

if __name__ == '__main__':
    user = User.new_user('test@test.com', 'mypassword')
    assert user.email == 'test@test.com'