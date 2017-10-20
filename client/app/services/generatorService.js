/*global angular, document, Prism, window*/

angular.module('lbconfigApp').factory('GeneratorService', function ($location, CONSTANT, UtilityService) {
    'use strict';
    var generator = {};
    generator.calculate = function (config, stash) {
        /**
         * APACHE
         */

        // apacheTotalInstances
        stash.apache_total_instances = config.apacheServerCount;

        // apache_max_clients
        if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.PREFORK) {
            stash.apache_max_clients = (config.apacheCoresPerServer * 200);
        } else if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.WORKER || config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.WINNT) {
            stash.apache_max_clients = (config.apacheCoresPerServer * 300);
        } else if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.EVENT) {
            stash.apache_max_clients = (config.apacheCoresPerServer * 256);
        }
        if (config.isSameServer) {
            stash.apache_max_clients = stash.apache_max_clients / 2;
        }

        // apache_threads_per_child_worker
        if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.WORKER || config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.EVENT) {
            if (stash.apache_max_clients <= 1200) {
                stash.apache_threads_per_child_worker = stash.apache_max_clients / 10;
            } else if (stash.apache_max_clients > 1200 && stash.apache_max_clients <= 2400) {
                stash.apache_threads_per_child_worker = stash.apache_max_clients / 16;
            } else if (stash.apache_max_clients > 2400) {
                stash.apache_threads_per_child_worker = stash.apache_max_clients / 20;
            }
            stash.apache_processes = stash.apache_max_clients / stash.apache_threads_per_child_worker;
        } else if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.WINNT || config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.PREFORK) {
            stash.apache_threads_per_child_worker = stash.apache_max_clients;
            stash.apache_processes = 1;
        }

        // apache_total_threads
        stash.apache_total_threads = config.apacheServerCount * stash.apache_max_clients;

        /**
         * JBOSS
         */

        // jboss_max_threads
        stash.jboss_max_threads = (config.beckendCoresPerServer * 300) / config.beckendJVMsPerServer;
        if (config.isSameServer) {
            stash.jboss_max_threads = stash.jboss_max_threads / 2;
        }

        // jboss_total_instances
        stash.jboss_total_instances = config.beckendServerCount * config.beckendJVMsPerServer;

        // jboss_total_threads
        stash.jboss_total_threads = stash.jboss_total_instances * stash.jboss_max_threads;

        // jboss_threads_per_instance
        stash.jboss_threads_per_instance = stash.jboss_total_threads / stash.jboss_total_instances;

        // max_clients_div_total_jboss_instances
        stash.max_clients_div_total_jboss_instances = stash.apache_max_clients / stash.jboss_total_instances;

        // apache_poolsize
        if (stash.jboss_total_threads < stash.apache_total_threads) {
            stash.apache_poolsize = (stash.jboss_max_threads / stash.apache_processes) / config.apacheServerCount;
        } else {
            stash.apache_poolsize = ((stash.apache_max_clients / stash.jboss_total_instances) / stash.apache_processes);
        }
    };
    generator.generateTemplates = function (config, stash) {
        /**
         * Templates
         */

        // apache_mpm_conf
        if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.PREFORK) {
            stash.apache_mpm_conf = '<IfModule mpm_prefork_module>' +
                '\n\tServerLimit         ' + stash.apache_max_clients +
                '\n\tStartServers        5' +
                '\n\tMinSpareServers     5' +
                '\n\tMaxSpareServers     20' +
                '\n\tMaxClients          ' + stash.apache_max_clients +
                '\n\tMaxRequestsPerChild 0' +
                '\n</IfModule>';
        } else if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.WORKER) {
            stash.apache_mpm_conf = '<IfModule mpm_worker_module>\n' +
                '\tThreadLimit         ' + stash.apache_threads_per_child_worker + '\n' +
                '\tServerLimit         ' + stash.apache_processes + '\n' +
                '\tStartServers        3\n' +
                '\tMinSpareThreads     5\n' +
                '\tMaxSpareThreads     20\n' +
                '\tMaxClients          ' + stash.apache_max_clients + '\n' +
                '\tThreadsPerChild     ' + stash.apache_threads_per_child_worker + '\n' +
                '\tMaxRequestsPerChild 0\n' +
                '</IfModule>\n';
        } else if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.WINNT) {
            stash.apache_mpm_conf = '<IfModule mpm_winnt_module>\n' +
                '\tThreadLimit         ' + stash.apache_threads_per_child_worker + '\n' +
                '\tThreadsPerChild     ' + stash.apache_threads_per_child_worker + '\n' +
                '\tMaxRequestsPerChild 0\n' +
                '</IfModule>\n';
        } else if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.EVENT) {
            stash.apache_mpm_conf = '<IfModule mpm_event_module>\n' +
                '\tThreadLimit         ' + stash.apache_threads_per_child_worker + '\n' +
                '\tServerLimit         ' + stash.apache_processes + '\n' +
                '\tStartServers        3\n' +
                '\tMinSpareThreads     5\n' +
                '\tMaxSpareThreads     20\n' +
                '\tMaxClients          ' + stash.apache_max_clients + '\n' +
                '\tThreadsPerChild     ' + stash.apache_threads_per_child_worker + '\n' +
                '\tMaxRequestsPerChild 0\n' +
                '</IfModule>\n';
        }
        stash.apache_mpm_conf = Prism.highlight(stash.apache_mpm_conf, Prism.languages.apacheconf);

        // apache_httpd_conf
        if (config.apacheModuleType === CONSTANT.APACHE_MODULES.MOD_JK) {
            stash.apache_httpd_conf = "LoadModule jk_module modules/mod_jk.so\n" +
                "\n" +
                "JkWorkersFile conf/workers.properties\n" +
                "JkLogFile logs/mod_jk.log\n" +
                "JkLogLevel debug\n" +
                "JkLogStampFormat \"[%a %b %d %H:%M:%S %Y]\"\n" +
                "\n" +
                "# For mod_rewrite compatibility, use +ForwardURIProxy (default since 1.2.24)\n" +
                "JkOptions +ForwardKeySize +ForwardURICompatUnparsed -ForwardDirectories\n" +
                "\n" +
                "JkRequestLogFormat \"%w %V %T\"\n" +
                "\n" +
                "JkMountFile conf/uriworkermap.properties\n" +
                "\n" +
                "JkShmFile run/jk.shm\n" +
                "\n" +
                "JkWatchdogInterval 60\n" +
                "\n" +
                "<Location /jkstatus>\n" +
                "    JkMount status\n" +
                // check httpd version for access control directives
                ((config.apacheVersion === '24x') ? '    Require ip 127.0.0.1\n' : '    Order deny,allow\n' +
                    "    Deny from all\n" +
                    "    Allow from 127.0.0.1\n") +
                "</Location>";

            stash.apache_modjk_workers_conf = "worker.list=loadbalancer,status\n" +
                "worker.template.port=8009\n" +
                "worker.template.type=ajp13\n" +
                ((config.modjk_version !== "1.2.26") ? 'worker.template.ping_mode=A\n' : 'worker.template.prepost_timeout=10000\nworker.template.connect_timeout=10000\n') +
                ((config.longRunningNum > 10) ? "worker.template.reply_timeout=" + (config.longRunningNum * 1000) + "\n" : '') + "worker.template.socket_connect_timeout=10000\n" +
                ((config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.PREFORK) ? 'worker.template.connection_pool_timeout=600\n' : '') +
                ((config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.WORKER || config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.WINNT || config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.EVENT) ? 'worker.template.connection_pool_size=' + Math.round(stash.apache_poolsize) + '\n' : '') +
                ((config.isFirewall) ? 'worker.template.socket_keepalive=true\n' : '') +
                generator.generateWorkers(stash) +
                "worker.loadbalancer.type=lb\n" +
                "worker.loadbalancer.sticky_session=True\n" +
                "worker.status.type=status\n";

            stash.apache_modjk_workers_conf = Prism.highlight(stash.apache_modjk_workers_conf, Prism.languages.properties);

            stash.apache_modjk_uriworkermap_conf = "# Map application to balancer\n" +
                "/myapp=loadbalancer\n" +
                "/myapp/*=loadbalancer";

            stash.apache_modjk_uriworkermap_conf = Prism.highlight(stash.apache_modjk_uriworkermap_conf, Prism.languages.properties);
        } else if (config.apacheModuleType === CONSTANT.APACHE_MODULES.MOD_PROXY) {
            stash.apache_httpd_conf = "<Proxy balancer://mycluster>\n" +
                (generator.generateBalancerMembers(stash.jboss_total_instances, config.isFirewall, config.apacheMPMType !== CONSTANT.APACHE_MPM_TYPES.PREFORK, stash.apache_poolsize)) +
                '\n' +
                '    ProxySet stickysession=JSESSIONID|jsessionid timeout=10\n' +
                "</Proxy>\n" +
                "\n" +
                ((config.isLongRunning) ? 'ProxyTimeout ' + config.longRunningNum + '\n' : '') +
                "ProxyStatus On\n" +
                "ProxyPassMatch ^/myapp(.*) balancer://mycluster/myapp$1";
        } else if (config.apacheModuleType === CONSTANT.APACHE_MODULES.MOD_CLUSTER) {
            stash.apache_httpd_conf = ((config.apacheVersion === '24x') ? "LoadModule cluster_slotmem_module modules/mod_cluster_slotmem.so\n" :
                    "LoadModule slotmem_module modules/mod_slotmem.so\n") +
                    "LoadModule manager_module modules/mod_manager.so\n" +
                    "LoadModule proxy_cluster_module modules/mod_proxy_cluster.so\n" +
                    "LoadModule advertise_module modules/mod_advertise.so\n" +
                    "\n" +
                ((config.isLongRunning && (config.longRunningNum) && (config.longRunningNum > 300)) ? 'ProxyTimeout ' + config.longRunningNum + '\n' : '') +
                "Listen 127.0.0.1:6666\n" +
                "<VirtualHost 127.0.0.1:6666>\n" +
                "    <Directory \"/\">\n" +
                ((config.apacheVersion === '24x') ? '        Require ip 127.0.0.1\n' : '        Order deny,allow\n' +
                    "        Deny from all\n" +
                    "        Allow from 127.0.0.1\n") +
                    "    </Directory>\n" +
                "\n" +
                "    KeepAliveTimeout 60\n" +
                "    MaxKeepAliveRequests 0\n" +
                "    ManagerBalancerName mycluster\n" +
                "    EnableMCPMReceive\n" +
                ((config.apacheDiscoveryType === 'mcast') ? '    AdvertiseFrequency 5\n' : '    ServerAdvertise Off\n') +
                "</VirtualHost>\n" +
                "\n" +
                "<Location /mod_cluster-manager>\n" +
                "    SetHandler mod_cluster-manager\n" +
                ((config.apacheVersion === '24x') ? '    Require ip 127.0.0.1\n' : '    Order deny,allow\n' +
                    "    Deny from all\n" +
                    "    Allow from 127.0.0.1\n") +
                "</Location>";
        }
        stash.apache_httpd_conf = Prism.highlight(stash.apache_httpd_conf, Prism.languages.apacheconf);

        // jboss_ajp_conf
        if (config.beckendVersion === 7) {
            stash.jboss_ajp_conf = '<ajp-listener name="ajp" socket-binding="ajp" max-connections="' +
                Math.round(stash.jboss_max_threads) + '" />';
        } else if (config.beckendVersion === 6) {
            stash.jboss_ajp_conf = '<connector name="ajp" protocol="AJP/1.3" scheme="http" socket-binding="ajp" max-connections="' +
                Math.round(stash.jboss_max_threads) + '" />';
        } else {
            if (config.beckendVersion === 'tc') {
                stash.jboss_ajp_conf = '<Connector port="8009" protocol="AJP/1.3"\n' +
                    'emptySessionPath="true" enableLookups="false" redirectPort="8443"\n' +
                    'maxThreads="' + Math.round(stash.jboss_max_threads) + '" connectionTimeout="600000" />';
            } else {
                stash.jboss_ajp_conf = '<Connector port="8009" address="${jboss.bind.address}" protocol="AJP/1.3"\n' +
                    'emptySessionPath="true" enableLookups="false" redirectPort="8443"\n' +
                    'maxThreads="' + Math.round(stash.jboss_max_threads) + '" connectionTimeout="600000" />';
            }
        }
        stash.jboss_ajp_conf = Prism.highlight(stash.jboss_ajp_conf, Prism.languages.xml);

        // jboss_server_xml_conf jboss_beans_xml_conf
        if (config.apacheModuleType === CONSTANT.APACHE_MODULES.MOD_CLUSTER) {
            if (config.beckendVersion >= 6) {
                stash.jboss_profile_xml_conf = '<subsystem xmlns="urn:jboss:domain:modcluster:1.2">\n' +
                    '    <mod-cluster-config advertise-socket="modcluster" connector="ajp">\n' +
                    '        <dynamic-load-provider>\n' +
                    '            <load-metric type="busyness"></load-metric>\n' +
                    '        </dynamic-load-provider>\n' +
                    '    </mod-cluster-config>\n' +
                    '</subsystem>';
                stash.jboss_profile_xml_conf = Prism.highlight(stash.jboss_profile_xml_conf, Prism.languages.xml);
            } else if (config.beckendVersion === 'tc') {
                // configure the advertisement or proxyList settings on the Listener
                var advertise = "";
                if (config.apacheDiscoveryType === 'proxy') {
                    advertise = 'advertise="false" proxyList="127.0.0.1:6666"';
                } else {
                    advertise = 'advertise="true"';
                }

                stash.jboss_server_xml_conf = '<Listener className="org.jboss.modcluster.container.catalina.standalone.ModClusterListener" stickySession="true" stickySessionForce="false" stickySessionRemove="true" ' + advertise + ' />';
                stash.jboss_server_xml_conf = Prism.highlight(stash.jboss_server_xml_conf, Prism.languages.xml);
            } else {
                stash.jboss_server_xml_conf = '<!-- Add mod_cluster service listener -->\n' +
                    '<Listener className="org.jboss.web.tomcat.service.deployers.MicrocontainerIntegrationLifecycleListener" delegateBeanName="ModClusterListener" />';
                stash.jboss_beans_xml_conf = '<!-- Enable mod_cluster service -->\n' +
                    '<depends>ModClusterService</depends>';
                stash.jboss_server_xml_conf = Prism.highlight(stash.jboss_server_xml_conf, Prism.languages.xml);
                stash.jboss_beans_xml_conf = Prism.highlight(stash.jboss_beans_xml_conf, Prism.languages.xml);
            }
        }
    };
    generator.generateWorkers = function (stash) {
        var i = 0,
            node_list = "",
            ret = "";

        ret = ret + "# NOTE! The following commented lines are example values only! please modify them to suit your environment\n";
        for (i = 1; i < stash.jboss_total_instances + 1; i = i + 1) {
            ret = ret + "# worker.node" + i + ".reference=worker.template\n";
            ret = ret + "# worker.node" + i + ".host=192.168.1." + i + "\n";
            node_list = node_list + 'node' + i + ',';
        }
        ret = ret + "# worker.loadbalancer.balance_workers=" + node_list.replace(/,$/, '\n');
        return ret;
    };
    generator.generateBalancerMembers =  function (count, firewall, not_prefork, poolsize) {
        var i, ret = '';
        ret = ret + "    # NOTE! The following commented lines are example values only! please modify them to suit your environment\n";
        for (i = 0; i < count; i = i + 1) {
            ret = ret + "    # BalancerMember ajp://192.168.1." + i + ":8009 route=node" + i + " loadfactor=1 ping=10 ttl=600 " + (firewall ? "keepalive=On " : "") + (not_prefork ? "max=" + Math.round(poolsize) : "") + "\n";
        }
        return ret;
    };
    generator.generateWarnings = function (config, stash) {
        var warnings = [],
            jboss_capacity_used = stash.apache_total_threads / stash.jboss_total_threads;

        if (config.beckendVersion === 'tc') {
            stash.backend_type = 'Apache Tomcat';
        } else {
            stash.backend_type = 'JBoss';
        }

        if (jboss_capacity_used < 0.60) {
            warnings.push({
                sev: 'info',
                text: stash.backend_type + " can process a total of " +
                    stash.jboss_total_threads +
                    " requests and is being under utilized by Apache which can only handle " +
                    stash.apache_total_threads +
                    " requests. Add another Apache server or put Apache on a machine with more cores."
            });
        } else if (jboss_capacity_used >= 0.90 && jboss_capacity_used <= 1) {
            warnings.push({
                sev: 'info',
                text: stash.backend_type + " can process a total of " +
                    stash.jboss_total_threads +
                    " requests and is close to being potentially overwhelmed by Apache which can handle " +
                    stash.apache_total_threads +
                    " requests. Be sure to allow some headroom for failure of a " + stash.backend_type + " node."
            });
        } else if (jboss_capacity_used > 1) {
            if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.PREFORK) {
                warnings.push({
                    sev: 'info',
                    text: stash.backend_type + " can only handle " +
                        stash.jboss_total_threads +
                        " requests and can be overwhelmed by Apache which can handle up to " +
                        stash.apache_total_threads +
                        " requests.  Add more " + stash.backend_type + " servers or remove Apache servers so that " + stash.backend_type + " has adequate processing power to handle the potential requests from Apache."
                });
            } else if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.WORKER) {
                warnings.push({
                    sev: 'info',
                    text: "Apache can handle " +
                        (stash.apache_total_threads - stash.jboss_total_threads) +
                        " more requests than " + stash.backend_type + ", consider redistributing the Apache/" + stash.backend_type + " machines so more processing power can be utilized."
                });
            } else if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.EVENT) {
                warnings.push({
                    sev: 'info',
                    text: "Apache can handle " +
                        (stash.apache_total_threads - stash.jboss_total_threads) +
                        " more requests than " + stash.backend_type + ", consider redistributing the Apache/" + stash.backend_type + " machines so more processing power can be utilized."
                });
            }
        }

        if (config.apacheMPMType === CONSTANT.APACHE_MPM_TYPES.PREFORK && config.apacheCoresPerServer >= 2) {
            warnings.push({
                sev: 'info',
                text: "You can increase performance in Apache by using the worker mpm versus the prefork mpm in a multicore environment."
            });
        }

        warnings.forEach(function (warning) {
            if (warning.sev === 'info') {
                warning.icon_class = 'icon-info-circle';
            }
            if (warning.sev === 'warning') {
                warning.icon_class = 'icon-warning';
            }
        });

        stash.warnings = warnings;
    };
    generator.generateURL = function (config) {
        var temp = '';
        for (var variable in config) {
            if (config.hasOwnProperty(variable)) {
                temp = temp + config[variable] + ',';
            }
        }
        temp = temp.substring(0, temp.length - 1);
        $location.hash('/?' +UtilityService.b64EncodeUnicode(temp));
    };
    return generator;
});
