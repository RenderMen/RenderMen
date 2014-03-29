from flask import Flask, render_template
app = Flask(__name__)

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
    app.run(debug=True)