#!/usr/bin/env python
# -*- coding: utf-8 -*-
from functools import wraps

import mongoengine
from flask import Flask, render_template, session, request, jsonify, g, redirect

import config
from model.user import User, hash_password

from glsl.scene import boiler_scene


# Flask app
app = Flask(__name__)
app.secret_key = config.session_secret_key

# DB init
mongoengine.connect(config.db_name)
User.drop_collection()
dummy = User.new_user('test@test.com', 'password')
dummy.save()

# GLSL init
glsl_scene = boiler_scene()

def requires_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in', None):
            return redirect('/login')
        else:
            return f(*args, **kwargs)
    return decorated_function

@app.context_processor
def load_template_user():
    if session.get('logged_in'):
        return dict(user=User.objects.get(email=session['logged_in']))
    return dict(user=None)

@app.before_request
def load_request_user():
    g.user = User.objects(email=session.get('logged_in')).first()

@app.route("/")
def hello():
    return render_template('index.html')

@app.route("/api/shader")
def api_shader():
    return jsonify(ok=True, result=glsl_scene.composeGLSL())

@app.route("/api/login", methods=['POST'])
def api_connect():
    email, password = request.json['email'].lower(), request.json['password']
    try:
        user = User.objects.get(email=email)
        if user.secret_hash == hash_password(password, user.salt):
            connect_user(user)
            return jsonify(ok=True)
        else:
            return jsonify(ok=False)
    except mongoengine.DoesNotExist:
        return jsonify(ok=False)

def connect_user(user):
    session['logged_in'] = user.email

if __name__ == "__main__":
    app.run('0.0.0.0', 5000, debug=True)
