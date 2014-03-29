#!/usr/bin/env python
# -*- coding: utf-8 -*-

import mongoengine
from flask import Flask, render_template, session, request

import config
from model.user import User

# Flask app
app = Flask(__name__)

# DB init
mongoengine.connect(config.db_name)
User.drop_collection()
dummy = User.new_user('test@test.com', 'password')
dummy.save()

@app.route("/")
def hello():
    return render_template('index.html')

@app.route("/api/shader")
def shader():
    code = """
    void main()
    {
        gl_FragColor = vec4(0.4,0.4,0.8,1.0);
    }
    """
    return code

if __name__ == "__main__":
    app.run('0.0.0.0', 5000, debug=True)