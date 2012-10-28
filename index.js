var Concentrate = module.exports = function Concentrate() {
  if (!(this instanceof Concentrate)) { return new Concentrate(); }

  this.jobs = [];
};

Concentrate.prototype.copy = function copy() {
  var copy = new Concentrate();
  copy.jobs = this.jobs.slice(0);
  return copy;
};

Concentrate.prototype.reset = function reset() {
  this.jobs.splice(0);

  return this;
};

Concentrate.prototype.result = function result() {
  var buffer = new Buffer(this.jobs.reduce(function(i, v) { return i + v.length; }, 0));

  var offset = 0;
  this.jobs.forEach(function(job) {
    var method = ["write", job.type].join("_");

    if (typeof this[method] === "function") {
      offset += this[method](job, buffer, offset);
    }
  }.bind(this));

  return buffer;
};

Concentrate.prototype.write_number = function write_number(job, buffer, offset) {
  buffer[job.method](job.data, offset);
  return job.length;
};

Concentrate.prototype.write_buffer = function write_buffer(job, buffer, offset) {
  job.data.copy(buffer, offset);
  return job.data.length;
};

Concentrate.prototype.buffer = function buffer(data) {
  this.jobs.push({type: "buffer", data: data, length: data.length});
  return this;
};

Concentrate.prototype.string = function string(data, encoding) {
  return this.buffer(new Buffer(data, encoding));
};

[8, 16, 32].forEach(function(b) {
  ["", "u"].forEach(function(s) {
    ["", "le", "be"].forEach(function(e) {
      var type = [s, "int", b, e].join(""),
          method = ["write", s.toUpperCase(), "Int", b, e.toUpperCase()].join(""),
          length = b / 8;

      Concentrate.prototype[type] = function(data) {
        this.jobs.push({
          type: "number",
          method: method,
          length: length,
          data: data,
        });

        return this;
      };
    });
  });
});