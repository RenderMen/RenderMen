#!/usr/bin/env python
# -*- coding: utf-8 -*-
from functools import wraps
import json

import mongoengine
from flask import Flask, render_template, session, request, jsonify, g, redirect

import config
from model.user import User, hash_password

from glsl.scene import Rendering, Scene, boiler_scene

# Monkey-patching mongoengine
mongoengine.Document.to_dict = lambda d : json.loads(d.to_json())

# Flask app
app = Flask(__name__)
app.secret_key = config.session_secret_key

# DB init
db = mongoengine.connect(config.db_name)
db.drop_database(config.db_name)
dummy = User.new_user('ahmed.kachkach@gmail.com', 'halflings', 'password')
dummy.save()

# GLSL init
glsl_scene = boiler_scene(dummy, title="Dummy Scene", description="Just a random dummy scene")
glsl_scene.save()

another_glsl_scene = boiler_scene(dummy, title="Another Dummy Scene", description="And here you go : yet another dummy scene.")
another_glsl_scene.save()

r1 = Rendering(width=600, height=400, samples=16, scene=glsl_scene).save()
r2 = Rendering(width=600, height=400, samples=16, scene=another_glsl_scene).save()

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
def index():
    return render_template('index.html')

@app.route("/profile")
@requires_login
def profile():
    scenes = Scene.objects(created_by=g.user)
    renderings = Rendering.objects(scene__in=scenes)
    return render_template('profile.html', renderings=renderings)

@app.route("/add_scene")
@requires_login
def add_scene():
    return render_template('add_scene.html')

# API
@app.route("/api/shader")
def api_shader():
    return jsonify(ok=True, result=glsl_scene.composeGLSL())

@app.route("/api/rendering/last")
def api_rendering():
    rendering = Rendering.objects().order_by('-date_created').first()
    return jsonify(ok=True, result=rendering.to_dict())


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

    if User.objects(email=email).first():
        return jsonify(ok=False, message="This email is already used.")
    try:
        user = User.new_user(email=email, username=username, password=password)
        user.save()
        connect_user(user)
        return jsonify(ok=True)
    except mongoengine.ValidationError:
        return jsonify(ok=False, error="Incorrect email or password")

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
