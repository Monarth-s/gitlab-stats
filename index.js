require('dotenv').config();
const express = require('express')
const app = express()
const mongodb = require('./services/mongo');
const Contirbution = require('./models/Contirbution');
const template = require('./template');

mongodb.initialize();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const calculateRank = function(max, totalCommits) {
  const RANK_A = max / 4 * 3;
  const RANK_B = max / 4 * 3;
  const RANK_C = max / 4 * 2;
  const RANK_D = max / 4;
  let rank;


  if(totalCommits > RANK_A) {
      rank = 'A+';
  } else if(totalCommits < RANK_D) {
      rank = 'D+';        
  } else if(totalCommits < RANK_C) {
      rank = 'C+';
  } else if(totalCommits < RANK_B) {
      rank = 'B+';
  } else {
      rank = 'D+';
  }
  return rank;
}

const all_themes = ['light', 'dark'];

app.get('/contributor/stats/:email', async function(req, res, next) {
  try {
    let theme = req.query.theme;

    let selected_theme = 'light';

    if(theme && all_themes.includes(theme.trim())) {
        selected_theme = theme.trim();
    }

    let email = req.params.email;

    if (req.params.email) {
        email = email.trim();
    } else {
        res.setHeader('content-type', 'image/svg+xml; charset=utf-8');
        return res.send('');
    }

    const contributions = await Contirbution.aggregate([{$match: {
        email
      }}, {$group: {
        _id: email,
        totalCommits: { $sum: "$commits" },
        totalRepos: { $sum: 1 }
    }}]);

    let totalCommits = 0;
    let totalRepos = 0;

    if (contributions.length) {
        totalCommits = contributions[0].totalCommits;
        totalRepos = contributions[0].totalRepos;
    }

    var templateClone = template.code;

    template['styles'][selected_theme].forEach((ele, index) => {
        templateClone = templateClone.replace(`__CHANGE_${index}`, ele);
    });
    
    templateClone = templateClone.replace('__TOTAL_COMMITS__', totalCommits);
    templateClone = templateClone.replace('__TOTAL_REPOS__', totalRepos);

    const maxCommits = await Contirbution.aggregate([{
        $group: {
            _id: '$email',
            totalCommits: {
                $sum: '$commits'
            }
        }
    }, {
        $group: {
            _id: null,
            max: {
                $max: '$totalCommits'
            }
        }
    }]);

    let max = (maxCommits.length) ? maxCommits[0].max : 0;

    let precent = 100 * totalCommits / max;

    const maxCirlcle = 251.32741228718345;

    let circle = maxCirlcle * precent / 100;

    templateClone = templateClone.replace('__RANK_CIRCLE', maxCirlcle - circle);

    templateClone = templateClone.replace('__RANK__', calculateRank(max, totalCommits));

    res.setHeader('content-type', 'image/svg+xml; charset=utf-8');
    return res.send(templateClone);
  } catch (err) {
    console.error(`Error while getting quotes `, err.message);
    res.status(err.statusCode || 500).json({'message': err.message});
  }
});

// Catch all handler for all other request.
app.use('*', (req, res) => {
  res.json({ msg: 'no route handler found' }).end()
})

// Start the server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`index.js listening on ${port}`)
})
