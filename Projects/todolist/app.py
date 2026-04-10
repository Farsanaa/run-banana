from flask import Flask, render_template, request, redirect
from datetime import datetime

app = Flask(__name__)

tasks = []

@app.route('/')
def index():
    return render_template('index.html', tasks=tasks)

@app.route('/add', methods=['POST'])
def add():
    task_content = request.form.get('content')
    time = datetime.now().strftime("%Y-%m-%d %H:%M")

    if task_content:
        tasks.append({
            'content': task_content,
            'time': time,
            'done': False
        })

    return redirect('/')

@app.route('/delete/<int:index>')
def delete(index):
    if 0 <= index < len(tasks):
        tasks.pop(index)
    return redirect('/')

@app.route('/complete/<int:index>')
def complete(index):
    if 0 <= index < len(tasks):
        tasks[index]['done'] = not tasks[index]['done']
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)