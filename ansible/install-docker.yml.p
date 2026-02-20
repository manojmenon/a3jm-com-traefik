
# https://www.hostinger.com/tutorials/how-to-use-ansible-to-install-docker?utm_campaign=Generic-Tutorials-DSA|NT:Se|LO:Other-EU&utm_medium=ppc&gad_source=1&gad_campaignid=12231291749&gbraid=0AAAAADMy-hbLHQh3SCgFf_--EQLLNE2LM&gclid=Cj0KCQjw-4XFBhCBARIsAAdNOksxa1I4gYthvhOPBKekWRXiDpQGQyvWRnoy5mBw2BWeOVWOf8c-2v8aAnCBEALw_wcB

- name: Install Docker on Ubuntu
  hosts: local
  become: true
  tasks:
    - name: Install required packages
      apt:
        name:
          - apt-transport-https
          - ca-certificates
          - curl
          - software-properties-common
        state: present
        update_cache: true

    - name: Add Docker’s official GPG key
      apt_key:
        url: https://download.docker.com/linux/ubuntu/gpg
        state: present

    - name: Add Docker repository
      apt_repository:
        repo: deb https://download.docker.com/linux/ubuntu focal stable
        state: present

    - name: Install Docker
      apt:
        name: docker-ce
        state: latest
        update_cache: true
    
    - name: Install Docker Compose
      get_url:
        url: https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64
        dest: /usr/local/bin/docker-compose
        mode: '0755'

    - name: Install Nginx
      apt:
        name: nginx
        state: present
        update_cache: true

    - name: Install Certbot and python3-certbot-nginx
      apt:
        name:
          - certbot
          - python3-certbot-nginx
        state: present
        update_cache: true

    - name: Obtain and install Let's Encrypt certificate for Nginx
      command: >
        certbot --nginx --non-interactive --agree-tos --redirect
        -m manoj.menon@a3jm.com -d www.a3jm.com
      args:
        creates: /etc/letsencrypt/live/www.a3jm.com/fullchain.pem
    
    - name: Copy custom index.html to Nginx web root
      copy:
        src: index.html
        dest: /var/www/html/index.html
        owner: www-data
        group: www-data
        mode: '0644'

    - name: Reload Nginx to apply changes
      service:
        name: nginx
        state: reloaded

    - name: Run PostgreSQL in Docker
      docker_container:
        name: postgres
        image: postgres:15
        state: started
        restart_policy: always
        env:
          POSTGRES_USER: myuser
          POSTGRES_PASSWORD: mypassword
          POSTGRES_DB: mydb
        ports:
          - "5432:5432"
        volumes:
          - pgdata:/var/lib/postgresql/data
    