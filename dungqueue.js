//function Queue() {
//   this.elements = [];
//}
/*
exports.Queue = function() { 
	this.elements = [];
}

Queue.prototype.enqueue = function (e) {
   this.elements.push(e);
};

// remove an element from the front of the queue
Queue.prototype.dequeue = function () {
    return this.elements.shift();
};

// check if the queue is empty
Queue.prototype.isEmpty = function () {
    return this.elements.length == 0;
};

// get the element at the front of the queue
Queue.prototype.peek = function () {
    return !this.isEmpty() ? this.elements[0] : undefined;
};

Queue.prototype.length = function() {
    return this.elements.length;
}
*/

class Queue {
  constructor() {
    this.elements = [];
  }
	
  enqueue(e) {
	this.elements.push(e);
  }

  // remove an element from the front of the queue
  dequeue() {
    return this.elements.shift();
  }

  // check if the queue is empty
  isEmpty() {
     return this.elements.length == 0;
  }

  // get the element at the front of the queue
  peek() {
    return !this.isEmpty() ? this.elements[0] : undefined;
  }

  length() {
    return this.elements.length;
  }
}

module.exports = Queue;
