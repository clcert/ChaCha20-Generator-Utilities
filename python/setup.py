from setuptools import setup

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name='clcert_chachagen',
    version='1.0',
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=['clcert_chachagen'],
    url='https://github.com/FrancoPinoC/ChaCha20-Generator-Utilities/tree/master/python',
    license='',
    author='Camilo Gómez, Franco Pino',
    author_email='random@uchile.cl ',
    description='Library of random related utilities, based on the ChaCha20 stream cipher',
    install_requires=['pycryptodome>=3.8.1']
)
