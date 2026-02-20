FROM ubuntu:latest

# bring the system up to date
RUN apt-get update -y
RUN apt-get upgrade -y

# get dependencies
RUN apt-get install git -y
RUN apt-get install build-essential -y
RUN apt-get install flex -y
RUN apt-get install bison -y
RUN apt-get install libssl-dev -y
RUN apt-get install libexpat1-dev -y

# get the unbound source
WORKDIR /tmp
RUN git clone https://github.com/NLnetLabs/unbound.git 

# build and install unbound from source
WORKDIR /tmp/unbound
RUN ./configure 
RUN make 
RUN make install

# adduser unbound because unbound wants to run as user unbound
RUN adduser --disabled-password --gecos '' unbound
