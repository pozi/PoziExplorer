#!/usr/bin/env ruby

require "json"

Dir.glob("*.json").each do |file|
  puts file
  data = JSON.parse(File.read(file))
  data['layers'] = data['layers'].reverse
  IO.write file, JSON.pretty_generate(data, indent: "    ")
end

