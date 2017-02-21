
var SBOLDocument = require('sboljs')

var sparql = require('./sparql/sparql')

var config = require('./config')

var resolveBatch = config.get('resolveBatch')

var webOfRegistries = config.get('webOfRegistries')

var request = require('request')

var async = require('async')

function getSBOL(sbol, type, graphName, URIs) {

    sbol._resolving = {};
    sbol._rootUri = URIs[0]

    var complete = false;

    URIs.forEach((uri) => sbol.lookupURI(uri))

    return new Promise((resolve, reject) => {

        async.series([

            function getLocalParts(next) {

                completePartialDocument(graphName, sbol, type, (err) => {

                    if(err) {
                        next(err)

                    } else {

                        if(!complete) {

                            complete = true

                            next()
                        }

                    }
                })
            },

            function fetchNonLocalSBOL(next) {
                async.each(sbol.unresolvedURIs, (uri, nextUri) => {
		    // TODO: temporary until URIs fixed
		    if (uri.toString().startsWith('http://synbiohub.org/terms/')) {
			nextUri()
		    } else {
			prefix = uri.toString().replace('http://','')
			prefix = prefix.substring(0,prefix.indexOf('/'))
			if (webOfRegistries[prefix]) {
			    uri = uri.replace(prefix,webOfRegistries[prefix]) + '/sbol'
			    console.log('fetching: ' + uri)
			    request({
				method: 'GET',		
				uri: uri,
				'content-type': 'application/rdf+xml',
			    }, function(err, response, body) {		
				if(err || response.statusCode >= 300) {		
				    console.log('not found')
				    nextUri()
				} else {
				    sbol.loadRDF(body, nextUri)
				}
			    })
			} else {
			    nextUri()
			}
		    }
                }, next)
            }

        ], function done(err) {

            if (err) {

                reject(err)

            } else {

                resolve({
                    sbol: sbol,
                    object: sbol.lookupURI(sbol._rootUri)
                })
            }
        })

    })

}

module.exports = getSBOL

function completePartialDocument(graphName, sbol, type, next) {

    if(sbol.unresolvedURIs.length === 0) {

        next();

    } else {
 
        var toResolve = sbol.unresolvedURIs.filter((uri) => !sbol._resolving[uri])

        toResolve = toResolve.slice(0, resolveBatch)

        retrieveSBOL(graphName, sbol, type, toResolve, () => {

            var done = true

            for(var i = 0; i < sbol.unresolvedURIs.length; ++ i) {
                if (toResolve.indexOf(sbol.unresolvedURIs[i]) === -1) {
                    done = false
                }
            }

            if (done) {
                next()
                return
            }

            completePartialDocument(graphName, sbol, type, next)

        })
    }
}

function retrieveSBOL(graphName, sbol, type, uris, next) {

    var query = sparqlDescribeSubjects(sbol, type, uris)

    Object.assign(sbol._resolving, uris)

    sparql.query(query, graphName, 'application/rdf+xml').then((res) => {
        
        sbol.loadRDF(res.body, next)
        
    }).catch((err) => {

        next(err)

    })
    
}

function sparqlDescribeSubjects(sbol, type, uris) {

    /*
    var triples = uris.map((uri, n) =>
        sparql.escapeIRI(uri) + ' ?p' + n + ' ?o' + n + ' .'
    )

    return [
        'CONSTRUCT {'
    ].concat(triples).concat([
        '} WHERE {'
    ]).concat(triples).concat([
        '}'
    ]).join('\n')*/

   var query = [
       'CONSTRUCT { ?s ?p ?o } WHERE {'
   ]

   var isFirst = true

   uris.forEach((uri) => {

       if(isFirst)
           isFirst = false
       else
           query.push('UNION')

       query.push(
           '{',
           '?s ?p ?o .'
        )

        if(uri === sbol._rootUri) {
	    if (type === "TopLevel") {
		query.push('?s a ?t .')
		// TODO: the generic top level will not work
		query.push('FILTER(?t = <http://sbols.org/v2#ComponentDefinition>' + ' ||' + 
			   ' ?t = <http://sbols.org/v2#ModuleDefinition>' + ' ||' + 
			   ' ?t = <http://sbols.org/v2#Model>' + ' ||' + 
			   ' ?t = <http://sbols.org/v2#Collection>' + ' ||' + 
			   ' ?t = <http://sbols.org/v2#Sequence>' + ' ||' + 
			   ' ?t = <http://sbols.org/v2#GenericTopLevel>)')
	    } else if (type != 'GenericTopLevel') {
		query.push('?s a <http://sbols.org/v2#' + type + '> .')
	    }
        }

        query.push(
           'FILTER(?s = ' + sparql.escapeIRI(uri) + ')',
           '}'
        )
   })

   query.push('}')

   return query.join('\n')
}


