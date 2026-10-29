#!/bin/python
import json
from html.parser import HTMLParser

class Board:
    def __init__(self):
        self.single = {}
        self.single_categories = []
        self.double = {}
        self.double_categories = []
        self.final = None
        self.question_count = 0

    def add_category(self, category):
        if len(self.single) < 6:
            self.single_categories.append(category)
        elif len(self.double) < 6:
            self.double_categories.append(category)
        else:
            self.final =  (category, None, None)

    def add_question(self, value, question, answer):
        if self.question_count < 30:
            cat = self.single_categories[self.question_count % 6]
            self.single.setdefault(cat, []).append((value, question, answer))
        elif self.question_count < 60:
            cat = self.double_categories[self.question_count % 6]
            self.double.setdefault(cat, []).append((value, question, answer))
        else:
            self.final = (self.final[0], question, answer)
        self.question_count += 1

    def __str__(self):
        return '\n'.join([str(self.single), str(self.double), str(self.final)])

class BoardParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.board = Board()
        self.value = None
        self.question = None
        self.answer = None
        self.next = None

    def handle_starttag(self, tag, attrs):
        if ("class", "category_name") in attrs:
            self.next = "category"
        elif ("class", "clue_text") in attrs and ("style", "display:none;") not in attrs:
            self.next = "clue"
        elif ("class", "correct_response") in attrs:
            self.next = "response"
        elif ("class", "clue_value") in attrs:
            self.next = "value"

    def handle_endtag(self, tag):
        self.next = None

    def handle_data(self, data):
        if self.next == "category":
            self.board.add_category(data)
        elif self.next == "value":
            self.value = data
        elif self.next == "clue":
            self.question = data
        elif self.next == "response":
            self.answer = data
        if self.question and self.answer:
            self.board.add_question(self.value, self.question, self.answer)
            self.value = None
            self.question = None
            self.answer = None

    def get_board(self):
        return self.board

with open("game.php") as game:
    parser = BoardParser()
    for line in game:
        parser.feed(line)
    parser.close()
    board = parser.get_board()
    print(json.dumps(vars(board)))
