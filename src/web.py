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
dummy = User.new_user('ahmed.kachkach@gmail.com', 'halflings', 'password')
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
        return dict(user=User.objects(email=session['logged_in']).first())
    return dict(user=None)

@app.before_request
def load_request_user():
    g.user = User.objects(email=session.get('logged_in')).first()

# Pages
@app.route("/")
def hello():
    return render_template('index.html')

@app.route("/profile")
@requires_login
def profile():
    return render_template('profile.html')

# API
@app.route("/api/shader")
def api_shader():
    return jsonify(ok=True, result=glsl_scene.composeGLSL())

@app.route("/api/login", methods=['POST'])
def api_connect():
    email, password = request.json['email'].lower().strip(), request.json['password']
    try:
        user = User.objects.get(email=email)
        if user.secret_hash == hash_password(password, user.salt):
            connect_user(user)
            return jsonify(ok=True)
        else:
            return jsonify(ok=False)
    except mongoengine.DoesNotExist:
        return jsonify(ok=False)

@app.route("/api/signup", methods=['POST'])
def api_signup():
    email, username, password = request.json['email'].lower().strip(), request.json['username'].lower().strip(), request.json['password']
    try:
        user = User.new_user(email=email, username=username, password=password)
        user.save()
        connect_user(user)
        return jsonify(ok=True)
    except mongoengine.ValidationError:
        return jsonify(ok=False)

@app.route("/api/logout", methods=['POST'])
def api_logout():
    session['logged_in'] = None
    return jsonify(ok=True)

def connect_user(user):
    session['logged_in'] = user.email
    load_request_user()
    load_template_user()

if __name__ == "__main__":
    app.run('0.0.0.0', 5000, debug=True)
