#!/usr/bin/env python
# -*- coding: utf-8 -*-
from functools import wraps
import json
from datetime import datetime

import mongoengine
from flask import Flask, render_template, session, request, jsonify, g, redirect

import config
from model.user import User, hash_password

from glsl.scene import Rendering, Scene, Assignment

# Monkey-patching mongoengine
mongoengine.Document.to_dict = lambda d : json.loads(d.to_json())

# Connecting to the database
mongoengine.connect(config.db_name)

# Flask app
app = Flask(__name__)
app.secret_key = config.session_secret_key

def requires_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in', None):
            return redirect('/')
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
    rendering = Rendering.objects().order_by('-date_created').first()
    return jsonify(ok=True, result=rendering.scene.composeGLSL())

@app.route("/api/rendering/first")
@requires_login
def api_first_rendering():
    available_renderings = [r for r in Rendering.objects().order_by('-date_created')
                            if any(a.status == Assignment.UNASSIGNED for a in Assignment.objects(rendering=r))]
    if available_renderings:
        rendering_dict = available_renderings[0].to_dict()
        # rendering_dict['completion'] = rendering.completion
        return jsonify(ok=True, result=rendering_dict)
    else:
        return jsonify(ok=False)

@app.route("/api/rendering/<rendering_id>")
@requires_login
def api_rendering(rendering_id):
    rendering = Rendering.objects.get(id=rendering_id)
    rendering_dict = rendering.to_dict()
    # rendering_dict['completion'] = rendering.completion

    return jsonify(ok=True, result=rendering_dict)

@app.route("/api/rendering/<rendering_id>/assignment")
@requires_login
def api_get_assignment(rendering_id):
    rendering = Rendering.objects.get(id=rendering_id)
    assignment = rendering.get_assignment()

    if assignment:
        # Assigning to user
        assignment.status = Assignment.ASSIGNED
        assignment.date = datetime.now()
        assignment.save()
        result = dict(completed=False, rendering=rendering.to_dict(), assignment=assignment.to_dict(), shader=assignment.composeGLSL())
        return jsonify(ok=True, result=result)
    else:
        return jsonify(ok=True, result=dict(completed=True))


@app.route("/api/assignment/<assignment_id>/complete", methods=['POST'])
@requires_login
def complete_assignment(assignment_id):
    assignment = Assignment.objects.get(id=assignment_id)
    assignment.status = Assignment.DONE
    # assignment.pixels = request.json['pixels']
    assignment.save()

    completed_pixels = int(assignment.width * assignment.height)

    g.user.pixels += completed_pixels
    g.user.credits += completed_pixels / 2
    g.user.save()

    rendering_author = assignment.rendering_author
    rendering_author.credits = min(0, rendering_author.credits - completed_pixels)
    rendering_author.save()

    return jsonify(ok=True)

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
