const exec = require('child_process').exec;
const fs = require('fs');
const async = require('async');
const request = require('request');

exec(`curl -G https://api.github.com/search/repositories \
--data-urlencode "q=created:>\`date -v-1d '+%Y-%m-%d'\`" \
--data-urlencode "sort=stars" \
--data-urlencode "order=desc" \
> ../src/data/trending_repos.json`)




const process_user = function(user, callback) {
  var options = {
    url: `https://api.github.com/users/${user.login}/events`,
    headers: {
      'User-Agent': 'top5'
    }
  };

  request(options, (error, response, body) => {

    var responseData = JSON.parse(body);
    var contributions = 0;

    responseData.forEach((event) => {
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if ((event.type === "PushEvent") && (event.created_at.slice(0, 10) === yesterday.toISOString().slice(0, 10))) contributions++;
    });

    var data = {
      username: user.login,
      url: user.html_url,
      contributions: contributions
    };

    callback(null, data);

  });
}

exec(`curl -G https://api.github.com/search/users \
--data-urlencode "q=type:user" \
--data-urlencode "sort=followers" \
--data-urlencode "order=desc" \
> ../src/data/most_followed.json`,
() => {
  const most_followed_users = require('./most_followed').items;
  async.map(most_followed_users, process_user, (err, results) => {
    console.log(results); // Should get commit count for all users today
    fs.writeFile('user_commits.json', JSON.stringify(results), (err) => {
      if (err) console.log(err);
      console.log(`Scraped user contributions`);
    });
  });
});